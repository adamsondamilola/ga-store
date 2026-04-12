using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Implementations;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ImageUploads;
using GaStore.Data.Models;
using GaStore.Shared.Uploads;
using GaStore.UploadService.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AppSettings>(builder.Configuration);
builder.Services.Configure<ImageOptimizationSettings>(builder.Configuration.GetSection("ImageOptimizationSettings"));
builder.Services.Configure<UploadServiceOptions>(builder.Configuration.GetSection(UploadServiceOptions.SectionName));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IImageUploadService, ImageUploadService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

var app = builder.Build();

app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();
