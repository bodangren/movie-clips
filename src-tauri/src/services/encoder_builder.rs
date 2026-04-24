use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EncoderType {
    #[serde(rename = "nvenc")]
    Nvenc,
    #[serde(rename = "vaapi")]
    Vaapi,
    #[serde(rename = "videotoolbox")]
    VideoToolbox,
    #[serde(rename = "software")]
    Software,
}

impl Default for EncoderType {
    fn default() -> Self {
        EncoderType::Software
    }
}

impl EncoderType {
    pub fn as_str(&self) -> &'static str {
        match self {
            EncoderType::Nvenc => "h264_nvenc",
            EncoderType::Vaapi => "h264_vaapi",
            EncoderType::VideoToolbox => "h264_videotoolbox",
            EncoderType::Software => "libx264",
        }
    }

    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "h264_nvenc" | "hevc_nvenc" | "nvenc" => Some(EncoderType::Nvenc),
            "h264_vaapi" | "vaapi" => Some(EncoderType::Vaapi),
            "h264_videotoolbox" | "videotoolbox" => Some(EncoderType::VideoToolbox),
            "libx264" | "libx265" | "software" => Some(EncoderType::Software),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum QualityPreset {
    #[serde(rename = "fast")]
    Fast,
    #[serde(rename = "balanced")]
    Balanced,
    #[serde(rename = "slow")]
    Slow,
}

impl Default for QualityPreset {
    fn default() -> Self {
        QualityPreset::Balanced
    }
}

impl QualityPreset {
    pub fn as_str(&self) -> &'static str {
        match self {
            QualityPreset::Fast => "fast",
            QualityPreset::Balanced => "medium",
            QualityPreset::Slow => "slow",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EncoderConfig {
    pub encoder: EncoderType,
    pub preset: QualityPreset,
    pub width: u32,
    pub height: u32,
    pub fps: u32,
}

impl Default for EncoderConfig {
    fn default() -> Self {
        Self {
            encoder: EncoderType::Software,
            preset: QualityPreset::Balanced,
            width: 1080,
            height: 1920,
            fps: 30,
        }
    }
}

pub struct EncodeCommandBuilder {
    config: EncoderConfig,
}

impl EncodeCommandBuilder {
    pub fn new(config: EncoderConfig) -> Self {
        Self { config }
    }

    pub fn build_args(&self, input: &str, output: &str) -> Vec<String> {
        let mut args = vec![
            "-y".to_string(),
            "-i".to_string(),
            input.to_string(),
        ];

        // Add encoder-specific args
        args.extend(self.encoder_args());

        // Add common args
        args.extend(self.common_args());

        // Add output
        args.push(output.to_string());

        args
    }

    pub fn build_args_with_dimensions(
        &self,
        input: &str,
        output: &str,
        dimensions: Option<(u32, u32)>,
    ) -> Vec<String> {
        let mut args = vec![
            "-y".to_string(),
            "-i".to_string(),
            input.to_string(),
        ];

        // Add video filter for dimensions if specified
        if let Some((w, h)) = dimensions {
            args.push("-vf".to_string());
            args.push(format!(
                "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2",
                w, h, w, h
            ));
        }

        // Add encoder-specific args
        args.extend(self.encoder_args());

        // Add common args
        args.extend(self.common_args());

        // Add output
        args.push(output.to_string());

        args
    }

    fn encoder_args(&self) -> Vec<String> {
        match self.config.encoder {
            EncoderType::Nvenc => self.nvenc_args(),
            EncoderType::Vaapi => self.vaapi_args(),
            EncoderType::VideoToolbox => self.videotoolbox_args(),
            EncoderType::Software => self.software_args(),
        }
    }

    fn nvenc_args(&self) -> Vec<String> {
        vec![
            "-c:v".to_string(),
            "h264_nvenc".to_string(),
            "-preset".to_string(),
            self.config.preset.as_str().to_string(),
            "-cq".to_string(),
            "23".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
        ]
    }

    fn vaapi_args(&self) -> Vec<String> {
        vec![
            "-vaapi_device".to_string(),
            "/dev/dri/renderD128".to_string(),
            "-c:v".to_string(),
            "h264_vaapi".to_string(),
            "-qp".to_string(),
            "23".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
        ]
    }

    fn videotoolbox_args(&self) -> Vec<String> {
        vec![
            "-c:v".to_string(),
            "h264_videotoolbox".to_string(),
            "-q:v".to_string(),
            "65".to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
        ]
    }

    fn software_args(&self) -> Vec<String> {
        vec![
            "-c:v".to_string(),
            "libx264".to_string(),
            "-crf".to_string(),
            "23".to_string(),
            "-preset".to_string(),
            self.config.preset.as_str().to_string(),
            "-pix_fmt".to_string(),
            "yuv420p".to_string(),
        ]
    }

    fn common_args(&self) -> Vec<String> {
        vec![
            "-c:a".to_string(),
            "aac".to_string(),
            "-b:a".to_string(),
            "128k".to_string(),
            "-movflags".to_string(),
            "+faststart".to_string(),
            "-r".to_string(),
            self.config.fps.to_string(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_encoder_type_from_str() {
        assert_eq!(EncoderType::from_str("h264_nvenc"), Some(EncoderType::Nvenc));
        assert_eq!(EncoderType::from_str("nvenc"), Some(EncoderType::Nvenc));
        assert_eq!(EncoderType::from_str("hevc_nvenc"), Some(EncoderType::Nvenc));
        assert_eq!(EncoderType::from_str("h264_vaapi"), Some(EncoderType::Vaapi));
        assert_eq!(EncoderType::from_str("vaapi"), Some(EncoderType::Vaapi));
        assert_eq!(
            EncoderType::from_str("h264_videotoolbox"),
            Some(EncoderType::VideoToolbox)
        );
        assert_eq!(
            EncoderType::from_str("videotoolbox"),
            Some(EncoderType::VideoToolbox)
        );
        assert_eq!(
            EncoderType::from_str("libx264"),
            Some(EncoderType::Software)
        );
        assert_eq!(
            EncoderType::from_str("software"),
            Some(EncoderType::Software)
        );
        assert_eq!(EncoderType::from_str("unknown"), None);
    }

    #[test]
    fn test_encoder_type_as_str() {
        assert_eq!(EncoderType::Nvenc.as_str(), "h264_nvenc");
        assert_eq!(EncoderType::Vaapi.as_str(), "h264_vaapi");
        assert_eq!(EncoderType::VideoToolbox.as_str(), "h264_videotoolbox");
        assert_eq!(EncoderType::Software.as_str(), "libx264");
    }

    #[test]
    fn test_quality_preset_as_str() {
        assert_eq!(QualityPreset::Fast.as_str(), "fast");
        assert_eq!(QualityPreset::Balanced.as_str(), "medium");
        assert_eq!(QualityPreset::Slow.as_str(), "slow");
    }

    #[test]
    fn test_nvenc_args() {
        let config = EncoderConfig {
            encoder: EncoderType::Nvenc,
            preset: QualityPreset::Balanced,
            width: 1080,
            height: 1920,
            fps: 30,
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.nvenc_args();

        assert!(args.contains(&"h264_nvenc".to_string()));
        assert!(args.contains(&"medium".to_string()));
        assert!(args.contains(&"-cq".to_string()));
        assert!(args.contains(&"23".to_string()));
        assert!(args.contains(&"yuv420p".to_string()));
    }

    #[test]
    fn test_nvenc_fast_preset() {
        let config = EncoderConfig {
            encoder: EncoderType::Nvenc,
            preset: QualityPreset::Fast,
            ..Default::default()
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.nvenc_args();
        assert!(args.contains(&"fast".to_string()));
    }

    #[test]
    fn test_vaapi_args() {
        let config = EncoderConfig {
            encoder: EncoderType::Vaapi,
            preset: QualityPreset::Balanced,
            ..Default::default()
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.vaapi_args();

        assert!(args.contains(&"-vaapi_device".to_string()));
        assert!(args.contains(&"/dev/dri/renderD128".to_string()));
        assert!(args.contains(&"h264_vaapi".to_string()));
        assert!(args.contains(&"-qp".to_string()));
        assert!(args.contains(&"23".to_string()));
    }

    #[test]
    fn test_videotoolbox_args() {
        let config = EncoderConfig {
            encoder: EncoderType::VideoToolbox,
            preset: QualityPreset::Balanced,
            ..Default::default()
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.videotoolbox_args();

        assert!(args.contains(&"h264_videotoolbox".to_string()));
        assert!(args.contains(&"-q:v".to_string()));
        assert!(args.contains(&"65".to_string()));
    }

    #[test]
    fn test_software_args() {
        let config = EncoderConfig {
            encoder: EncoderType::Software,
            preset: QualityPreset::Slow,
            ..Default::default()
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.software_args();

        assert!(args.contains(&"libx264".to_string()));
        assert!(args.contains(&"-crf".to_string()));
        assert!(args.contains(&"23".to_string()));
        assert!(args.contains(&"slow".to_string()));
    }

    #[test]
    fn test_build_args_structure() {
        let config = EncoderConfig {
            encoder: EncoderType::Software,
            preset: QualityPreset::Balanced,
            width: 1080,
            height: 1920,
            fps: 30,
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.build_args("input.mp4", "output.mp4");

        assert_eq!(args[0], "-y");
        assert_eq!(args[1], "-i");
        assert_eq!(args[2], "input.mp4");
        assert!(args.contains(&"libx264".to_string()));
        assert!(args.contains(&"aac".to_string()));
        assert_eq!(args.last().unwrap(), "output.mp4");
    }

    #[test]
    fn test_build_args_with_dimensions() {
        let config = EncoderConfig {
            encoder: EncoderType::Nvenc,
            preset: QualityPreset::Fast,
            width: 1080,
            height: 1920,
            fps: 30,
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.build_args_with_dimensions("input.mp4", "output.mp4", Some((1080, 1920)));

        assert!(args.contains(&"-vf".to_string()));
        let vf_idx = args.iter().position(|a| a == "-vf").unwrap();
        assert!(args[vf_idx + 1].contains("1080"));
        assert!(args[vf_idx + 1].contains("1920"));
        assert!(args.contains(&"h264_nvenc".to_string()));
    }

    #[test]
    fn test_encoder_config_default() {
        let config = EncoderConfig::default();
        assert_eq!(config.encoder, EncoderType::Software);
        assert_eq!(config.preset, QualityPreset::Balanced);
        assert_eq!(config.width, 1080);
        assert_eq!(config.height, 1920);
        assert_eq!(config.fps, 30);
    }

    #[test]
    fn test_common_args_include_fps() {
        let config = EncoderConfig {
            fps: 60,
            ..Default::default()
        };
        let builder = EncodeCommandBuilder::new(config);
        let args = builder.common_args();
        assert!(args.contains(&"60".to_string()));
    }

    #[test]
    fn test_all_encoders_include_pix_fmt() {
        for encoder in [
            EncoderType::Nvenc,
            EncoderType::Vaapi,
            EncoderType::VideoToolbox,
            EncoderType::Software,
        ] {
            let config = EncoderConfig {
                encoder: encoder.clone(),
                ..Default::default()
            };
            let builder = EncodeCommandBuilder::new(config.clone());
            let args = match config.encoder {
                EncoderType::Nvenc => builder.nvenc_args(),
                EncoderType::Vaapi => builder.vaapi_args(),
                EncoderType::VideoToolbox => builder.videotoolbox_args(),
                EncoderType::Software => builder.software_args(),
            };
            assert!(
                args.contains(&"yuv420p".to_string()),
                "Encoder {:?} missing pix_fmt",
                encoder
            );
        }
    }

    #[test]
    fn test_encoder_config_serialization() {
        let config = EncoderConfig {
            encoder: EncoderType::Nvenc,
            preset: QualityPreset::Fast,
            width: 1080,
            height: 1920,
            fps: 30,
        };
        let json = serde_json::to_string(&config).unwrap();
        assert!(json.contains("nvenc"));
        assert!(json.contains("fast"));

        let deserialized: EncoderConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config, deserialized);
    }
}
