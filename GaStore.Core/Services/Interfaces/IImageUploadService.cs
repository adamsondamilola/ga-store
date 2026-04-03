using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.ImageUploads;

namespace GaStore.Core.Services.Interfaces
{
    public interface IImageUploadService
    {
        Task<ImageUploadResult> UploadAndOptimizeImageAsync(IFormFile imageFile, string uploadPath = null);
        Task<List<ImageUploadResult>> UploadAndOptimizeImagesAsync(IEnumerable<IFormFile> imageFiles, string uploadPath = null);
        Task<ImageUploadResult> OptimizeAndSaveImageAsync(IFormFile imageFile, string savePath);
        Task<byte[]> OptimizeImageToBytesAsync(IFormFile imageFile);
        Task<Stream> OptimizeImageToStreamAsync(IFormFile imageFile);
        Task<bool> ValidateImageFileAsync(IFormFile imageFile);
        Task DeleteImageAsync(string imageUrl);
        string GenerateOptimizedFileName(string originalFileName);
       // ImageInfo GetImageInfo(IFormFile imageFile);
    }
}
