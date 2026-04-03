using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ImageUploads
{
    public class ImageUploadResult
    {
        public bool IsSuccess { get; set; }
        public string ImageUrl { get; set; }
        public string PublicId { get; set; } // For Cloudinary
        public string FileName { get; set; }
        public string FilePath { get; set; } // For local storage
        public long OriginalSize { get; set; }
        public long OptimizedSize { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public string Format { get; set; }
        public string ErrorMessage { get; set; }
        public Dictionary<string, string> AdditionalData { get; set; } = new();
    }

   
}
