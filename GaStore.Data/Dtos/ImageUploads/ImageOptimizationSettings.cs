using SixLabors.ImageSharp.Formats.Png;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Enums;

namespace GaStore.Data.Dtos.ImageUploads
{
    public class ImageOptimizationSettings
    {
        public bool EnableOptimization { get; set; } = true;
        public bool OptimizeBeforeUpload { get; set; } = true;
        public int MaxWidth { get; set; } = 1920;
        public int MaxHeight { get; set; } = 1080;
        public int MinWidth { get; set; } = 100;
        public int MinHeight { get; set; } = 100;
        public bool ForceResizeToMaxDimensions { get; set; } = false;
        public long MaxOriginalFileSize { get; set; } = 10 * 1024 * 1024; // 10MB
        public ImageFormat PreferredFormat { get; set; } = ImageFormat.WebP;
        public bool PreserveTransparency { get; set; } = true;

        // Format-specific settings
        public int JpegQuality { get; set; } = 85;
        public int WebpQuality { get; set; } = 80;
        public PngCompressionLevel PngCompressionLevel { get; set; } = PngCompressionLevel.BestCompression;

        // Additional optimization settings
        public bool StripMetadata { get; set; } = true;
        public bool EnableProgressiveJpeg { get; set; } = true;
    }
}
