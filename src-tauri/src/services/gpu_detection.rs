use serde::{Deserialize, Serialize};
use tokio::process::Command as TokioCommand;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GpuEncoderAvailability {
    pub nvenc: bool,
    pub vaapi: bool,
    pub videotoolbox: bool,
    pub software: bool,
}

impl Default for GpuEncoderAvailability {
    fn default() -> Self {
        Self {
            nvenc: false,
            vaapi: false,
            videotoolbox: false,
            software: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GpuDetectionResult {
    pub availability: GpuEncoderAvailability,
    pub detected_encoders: Vec<String>,
    pub primary_encoder: String,
    pub validation_status: ValidationStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ValidationStatus {
    Validated,
    ParseOnly,
    Failed(String),
}

pub struct GpuDetector {
    ffmpeg_path: String,
}

impl GpuDetector {
    pub fn new(ffmpeg_path: Option<String>) -> Self {
        Self {
            ffmpeg_path: ffmpeg_path.unwrap_or_else(|| "ffmpeg".to_string()),
        }
    }

    pub async fn detect(&self) -> GpuDetectionResult {
        let encoders = match self.list_encoders().await {
            Ok(output) => self.parse_encoders(&output),
            Err(e) => {
                return GpuDetectionResult {
                    availability: GpuEncoderAvailability::default(),
                    detected_encoders: vec![],
                    primary_encoder: "libx264".to_string(),
                    validation_status: ValidationStatus::Failed(format!(
                        "Failed to list encoders: {}",
                        e
                    )),
                }
            }
        };

        let mut availability = GpuEncoderAvailability {
            software: encoders.contains(&"libx264".to_string()) || encoders.contains(&"libx265".to_string()),
            ..Default::default()
        };

        if encoders.contains(&"h264_nvenc".to_string()) || encoders.contains(&"hevc_nvenc".to_string()) {
            availability.nvenc = true;
        }

        if encoders.contains(&"h264_vaapi".to_string()) {
            availability.vaapi = true;
        }

        if encoders.contains(&"h264_videotoolbox".to_string()) {
            availability.videotoolbox = true;
        }

        let primary = self.select_primary_encoder(&availability);

        let validation_status = if availability.nvenc || availability.vaapi || availability.videotoolbox
        {
            match self.validate_encoder(&primary).await {
                Ok(_) => ValidationStatus::Validated,
                Err(e) => {
                    tracing::warn!(encoder = %primary, error = %e, "GPU encoder validation failed, falling back to software");
                    availability.nvenc = false;
                    availability.vaapi = false;
                    availability.videotoolbox = false;
                    ValidationStatus::Failed(format!(
                        "Validation failed for {}: {}",
                        primary, e
                    ))
                }
            }
        } else {
            ValidationStatus::ParseOnly
        };

        GpuDetectionResult {
            availability: availability.clone(),
            detected_encoders: encoders,
            primary_encoder: self.select_primary_encoder(&availability),
            validation_status,
        }
    }

    async fn list_encoders(&self) -> Result<String, String> {
        let output = TokioCommand::new(&self.ffmpeg_path)
            .args(["-encoders"])
            .output()
            .await
            .map_err(|e| format!("Failed to run ffmpeg -encoders: {}", e))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            Err(format!(
                "ffmpeg -encoders failed with status: {:?}",
                output.status.code()
            ))
        }
    }

    fn parse_encoders(&self, output: &str) -> Vec<String> {
        output
            .lines()
            .filter_map(|line| {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 2 && parts[0].len() >= 6 {
                    Some(parts[1].to_string())
                } else {
                    None
                }
            })
            .collect()
    }

    fn select_primary_encoder(&self, availability: &GpuEncoderAvailability) -> String {
        if availability.nvenc {
            "h264_nvenc".to_string()
        } else if availability.videotoolbox {
            "h264_videotoolbox".to_string()
        } else if availability.vaapi {
            "h264_vaapi".to_string()
        } else {
            "libx264".to_string()
        }
    }

    async fn validate_encoder(&self, encoder: &str) -> Result<(), String> {
        let mut args = vec![
            "-f".to_string(),
            "lavfi".to_string(),
            "-i".to_string(),
            "color=c=black:s=64x64:d=1".to_string(),
            "-c:v".to_string(),
            encoder.to_string(),
            "-frames:v".to_string(),
            "1".to_string(),
            "-f".to_string(),
            "null".to_string(),
            "-".to_string(),
        ];

        if encoder == "h264_vaapi" {
            args.insert(0, "-vaapi_device".to_string());
            args.insert(1, "/dev/dri/renderD128".to_string());
        }

        let output = TokioCommand::new(&self.ffmpeg_path)
            .args(&args)
            .output()
            .await
            .map_err(|e| format!("Failed to run validation encode: {}", e))?;

        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(format!("Validation encode failed: {}", stderr.lines().next().unwrap_or("unknown error")))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gpu_encoder_availability_default() {
        let avail = GpuEncoderAvailability::default();
        assert!(!avail.nvenc);
        assert!(!avail.vaapi);
        assert!(!avail.videotoolbox);
        assert!(avail.software);
    }

    #[test]
    fn test_parse_encoders_finds_nvenc() {
        let detector = GpuDetector::new(Some("ffmpeg".to_string()));
        let output = r#"V....D libx264              H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10
V....D h264_nvenc           NVIDIA NVENC H.264 encoder
V....D hevc_nvenc           NVIDIA NVENC hevc encoder
V....D h264_vaapi           H.264/AVC (VAAPI)
V....D h264_videotoolbox    VideoToolbox H.264 Encoder
"#;
        let encoders = detector.parse_encoders(output);
        assert!(encoders.contains(&"h264_nvenc".to_string()));
        assert!(encoders.contains(&"hevc_nvenc".to_string()));
        assert!(encoders.contains(&"h264_vaapi".to_string()));
        assert!(encoders.contains(&"h264_videotoolbox".to_string()));
        assert!(encoders.contains(&"libx264".to_string()));
    }

    #[test]
    fn test_parse_encoders_empty_output() {
        let detector = GpuDetector::new(None);
        let encoders = detector.parse_encoders("");
        assert!(encoders.is_empty());
    }

    #[test]
    fn test_parse_encoders_ignores_header_lines() {
        let detector = GpuDetector::new(None);
        let output = "Encoders:\n V....D libx264\n ------\n";
        let encoders = detector.parse_encoders(output);
        assert!(encoders.contains(&"libx264".to_string()));
        assert_eq!(encoders.len(), 1);
    }

    #[test]
    fn test_select_primary_encoder_nvenc_first() {
        let detector = GpuDetector::new(None);
        let avail = GpuEncoderAvailability {
            nvenc: true,
            vaapi: true,
            videotoolbox: true,
            software: true,
        };
        assert_eq!(detector.select_primary_encoder(&avail), "h264_nvenc");
    }

    #[test]
    fn test_select_primary_encoder_videotoolbox_second() {
        let detector = GpuDetector::new(None);
        let avail = GpuEncoderAvailability {
            nvenc: false,
            vaapi: true,
            videotoolbox: true,
            software: true,
        };
        assert_eq!(detector.select_primary_encoder(&avail), "h264_videotoolbox");
    }

    #[test]
    fn test_select_primary_encoder_vaapi_third() {
        let detector = GpuDetector::new(None);
        let avail = GpuEncoderAvailability {
            nvenc: false,
            vaapi: true,
            videotoolbox: false,
            software: true,
        };
        assert_eq!(detector.select_primary_encoder(&avail), "h264_vaapi");
    }

    #[test]
    fn test_select_primary_encoder_fallback_to_software() {
        let detector = GpuDetector::new(None);
        let avail = GpuEncoderAvailability {
            nvenc: false,
            vaapi: false,
            videotoolbox: false,
            software: true,
        };
        assert_eq!(detector.select_primary_encoder(&avail), "libx264");
    }

    #[test]
    fn test_select_primary_encoder_no_software() {
        let detector = GpuDetector::new(None);
        let avail = GpuEncoderAvailability {
            nvenc: false,
            vaapi: false,
            videotoolbox: false,
            software: false,
        };
        assert_eq!(detector.select_primary_encoder(&avail), "libx264");
    }

    #[test]
    fn test_gpu_detection_result_serialization() {
        let result = GpuDetectionResult {
            availability: GpuEncoderAvailability {
                nvenc: true,
                vaapi: false,
                videotoolbox: false,
                software: true,
            },
            detected_encoders: vec!["h264_nvenc".to_string(), "libx264".to_string()],
            primary_encoder: "h264_nvenc".to_string(),
            validation_status: ValidationStatus::Validated,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("h264_nvenc"));
        assert!(json.contains("Validated"));
    }
}
