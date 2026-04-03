using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Dtos.ImageUploads
{
    public class ImageInfo
    {
        public int Width { get; set; }
        public int Height { get; set; }
        public string Format { get; set; }
        public string MimeType { get; set; }
        public long FileSize { get; set; }
        public bool HasTransparency { get; set; }
        public bool IsAnimated { get; set; }
    }
}
