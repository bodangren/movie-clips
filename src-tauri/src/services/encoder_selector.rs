use crate::services::encoder_builder::{EncoderConfig, EncoderType, QualityPreset};
use crate::services::gpu_detection::{GpuDetectionResult, GpuEncoderAvailability, ValidationStatus};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EncoderSelection {
    pub selected_encoder: EncoderType,
    pub preset: QualityPreset,
    pub is_hardware: bool,
    pub fallback_available: bool,
    pub selection_reason: String,
}

pub struct EncoderSelector {
    user_preference: Option<EncoderType>,
    default_preset: QualityPreset,
}

impl EncoderSelector {
    pub fn new(user_preference: Option<EncoderType>, default_preset: QualityPreset) -> Self {
        Self {
            user_preference,
            default_preset,
        }
    }

    pub fn select(&self,
        gpu_result: &GpuDetectionResult,
    ) -> EncoderSelection {
        let availability = &gpu_result.availability;

        // If user has a preference, try to honor it
        if let Some(pref) = &self.user_preference {
            if self.is_encoder_available(pref, availability) && self.is_encoder_validated(pref, gpu_result) {
                return EncoderSelection {
                    selected_encoder: pref.clone(),
                    preset: self.default_preset.clone(),
                    is_hardware: *pref != EncoderType::Software,
                    fallback_available: availability.software || availability.nvenc || availability.vaapi || availability.videotoolbox,
                    selection_reason: format!("User preference: {:?}", pref),
                };
            }
        }

        // Auto-select based on priority: NVENC > VideoToolbox > VAAPI > Software
        let (selected, reason) = if availability.nvenc && self.is_encoder_validated(&EncoderType::Nvenc, gpu_result) {
            (EncoderType::Nvenc, "Auto-selected: NVENC validated".to_string())
        } else if availability.videotoolbox && self.is_encoder_validated(&EncoderType::VideoToolbox, gpu_result) {
            (EncoderType::VideoToolbox, "Auto-selected: VideoToolbox validated".to_string())
        } else if availability.vaapi && self.is_encoder_validated(&EncoderType::Vaapi, gpu_result) {
            (EncoderType::Vaapi, "Auto-selected: VAAPI validated".to_string())
        } else {
            (EncoderType::Software, "Auto-selected: Software fallback".to_string())
        };

        EncoderSelection {
            selected_encoder: selected.clone(),
            preset: self.default_preset.clone(),
            is_hardware: selected != EncoderType::Software,
            fallback_available: true,
            selection_reason: reason,
        }
    }

    pub fn create_config(
        &self,
        gpu_result: &GpuDetectionResult,
        width: u32,
        height: u32,
        fps: u32,
    ) -> EncoderConfig {
        let selection = self.select(gpu_result);
        EncoderConfig {
            encoder: selection.selected_encoder,
            preset: selection.preset,
            width,
            height,
            fps,
        }
    }

    pub fn select_fallback(&self,
        failed_encoder: &EncoderType,
        gpu_result: &GpuDetectionResult,
    ) -> Option<EncoderType> {
        let availability = &gpu_result.availability;

        // If NVENC failed, try VideoToolbox, then VAAPI, then software
        // If any GPU failed, try other GPUs, then software
        match failed_encoder {
            EncoderType::Nvenc => {
                if availability.videotoolbox {
                    Some(EncoderType::VideoToolbox)
                } else if availability.vaapi {
                    Some(EncoderType::Vaapi)
                } else {
                    Some(EncoderType::Software)
                }
            }
            EncoderType::VideoToolbox => {
                if availability.nvenc {
                    Some(EncoderType::Nvenc)
                } else if availability.vaapi {
                    Some(EncoderType::Vaapi)
                } else {
                    Some(EncoderType::Software)
                }
            }
            EncoderType::Vaapi => {
                if availability.nvenc {
                    Some(EncoderType::Nvenc)
                } else if availability.videotoolbox {
                    Some(EncoderType::VideoToolbox)
                } else {
                    Some(EncoderType::Software)
                }
            }
            EncoderType::Software => None, // No fallback from software
        }
    }

    fn is_encoder_available(&self,
        encoder: &EncoderType,
        availability: &GpuEncoderAvailability,
    ) -> bool {
        match encoder {
            EncoderType::Nvenc => availability.nvenc,
            EncoderType::Vaapi => availability.vaapi,
            EncoderType::VideoToolbox => availability.videotoolbox,
            EncoderType::Software => availability.software,
        }
    }

    fn is_encoder_validated(&self,
        encoder: &EncoderType,
        gpu_result: &GpuDetectionResult,
    ) -> bool {
        match &gpu_result.validation_status {
            ValidationStatus::Validated => {
                // If overall validation passed, the primary encoder is validated
                // For simplicity, assume all detected encoders are validated if status is Validated
                self.is_encoder_available(encoder, &gpu_result.availability)
            }
            ValidationStatus::ParseOnly => {
                // No validation performed, only parsing
                // For software encoder, always allow
                // For hardware, be conservative and only allow if it's the primary
                if *encoder == EncoderType::Software {
                    true
                } else {
                    gpu_result.primary_encoder == encoder.as_str()
                }
            }
            ValidationStatus::Failed(_) => {
                // Validation failed for primary encoder
                // Only allow software fallback
                *encoder == EncoderType::Software
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn create_gpu_result(nvenc: bool, vaapi: bool, videotoolbox: bool, validated: bool) -> GpuDetectionResult {
        GpuDetectionResult {
            availability: GpuEncoderAvailability {
                nvenc,
                vaapi,
                videotoolbox,
                software: true,
            },
            detected_encoders: vec![],
            primary_encoder: if nvenc {
                "h264_nvenc".to_string()
            } else if videotoolbox {
                "h264_videotoolbox".to_string()
            } else if vaapi {
                "h264_vaapi".to_string()
            } else {
                "libx264".to_string()
            },
            validation_status: if validated {
                ValidationStatus::Validated
            } else {
                ValidationStatus::ParseOnly
            },
        }
    }

    #[test]
    fn test_auto_select_nvenc_first() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(true, true, true, true);
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::Nvenc);
        assert!(selection.is_hardware);
        assert!(selection.fallback_available);
    }

    #[test]
    fn test_auto_select_videotoolbox_second() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(false, true, true, true);
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::VideoToolbox);
    }

    #[test]
    fn test_auto_select_vaapi_third() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(false, true, false, true);
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::Vaapi);
    }

    #[test]
    fn test_auto_select_software_fallback() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(false, false, false, true);
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::Software);
        assert!(!selection.is_hardware);
    }

    #[test]
    fn test_user_preference_honored() {
        let selector = EncoderSelector::new(Some(EncoderType::Vaapi), QualityPreset::Fast);
        let gpu = create_gpu_result(true, true, true, true);
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::Vaapi);
        assert_eq!(selection.preset, QualityPreset::Fast);
    }

    #[test]
    fn test_user_preference_unavailable_falls_back() {
        let selector = EncoderSelector::new(Some(EncoderType::Nvenc), QualityPreset::Balanced);
        let gpu = create_gpu_result(false, true, false, true);
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::Vaapi);
    }

    #[test]
    fn test_fallback_from_nvenc() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(true, true, true, true);
        let fallback = selector.select_fallback(&EncoderType::Nvenc, &gpu);

        assert_eq!(fallback, Some(EncoderType::VideoToolbox));
    }

    #[test]
    fn test_fallback_from_videotoolbox_to_nvenc() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(true, false, true, true);
        let fallback = selector.select_fallback(&EncoderType::VideoToolbox, &gpu);

        assert_eq!(fallback, Some(EncoderType::Nvenc));
    }

    #[test]
    fn test_fallback_from_vaapi_to_software() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(false, true, false, true);
        let fallback = selector.select_fallback(&EncoderType::Vaapi, &gpu);

        assert_eq!(fallback, Some(EncoderType::Software));
    }

    #[test]
    fn test_no_fallback_from_software() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(true, true, true, true);
        let fallback = selector.select_fallback(&EncoderType::Software, &gpu);

        assert_eq!(fallback, None);
    }

    #[test]
    fn test_validation_failed_uses_software() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let mut gpu = create_gpu_result(true, false, false, false);
        gpu.validation_status = ValidationStatus::Failed("test".to_string());
        let selection = selector.select(&gpu);

        assert_eq!(selection.selected_encoder, EncoderType::Software);
    }

    #[test]
    fn test_create_config() {
        let selector = EncoderSelector::new(None, QualityPreset::Fast);
        let gpu = create_gpu_result(true, false, false, true);
        let config = selector.create_config(&gpu, 1080, 1920, 30);

        assert_eq!(config.encoder, EncoderType::Nvenc);
        assert_eq!(config.preset, QualityPreset::Fast);
        assert_eq!(config.width, 1080);
        assert_eq!(config.height, 1920);
        assert_eq!(config.fps, 30);
    }

    #[test]
    fn test_selection_reason() {
        let selector = EncoderSelector::new(None, QualityPreset::Balanced);
        let gpu = create_gpu_result(true, false, false, true);
        let selection = selector.select(&gpu);

        assert!(selection.selection_reason.contains("NVENC"));
    }

    #[test]
    fn test_user_preference_reason() {
        let selector = EncoderSelector::new(Some(EncoderType::Vaapi), QualityPreset::Balanced);
        let gpu = create_gpu_result(true, true, true, true);
        let selection = selector.select(&gpu);

        assert!(selection.selection_reason.contains("User preference"));
    }
}
