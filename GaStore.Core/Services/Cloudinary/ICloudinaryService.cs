using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Core.Services.Cloudinary
{
    public interface ICloudinaryService
    {
        Task<CloudinaryUploadResult> UploadImageAsync(IFormFile file);
        Task<CloudinaryUploadResult> UploadImageAsync(Stream fileStream, string fileName); // Add this
        Task<CloudinaryUploadResult> UploadImageAsync(byte[] fileBytes, string fileName);
        Task<CloudinaryUploadResult> UploadFileAsync(IFormFile file);
        Task<bool> DeleteFileAsync(string publicId);
    }
}
