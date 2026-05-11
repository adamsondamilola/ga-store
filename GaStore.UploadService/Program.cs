using GaStore.Core.Services.Cloudinary;
using GaStore.Core.Services.Implementations;
using GaStore.Core.Services.Interfaces;
using GaStore.Models.Database;
using GaStore.Data.Dtos.ImageUploads;
using GaStore.Data.Models;
using GaStore.Shared.Uploads;
using GaStore.UploadService.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<AppSettings>(builder.Configuration);
builder.Services.Configure<ImageOptimizationSettings>(builder.Configuration.GetSection("ImageOptimizationSettings"));
builder.Services.Configure<UploadServiceOptions>(builder.Configuration.GetSection(UploadServiceOptions.SectionName));
builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<ICloudinaryService, CloudinaryService>();
builder.Services.AddScoped<IImageUploadService, ImageUploadService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DatabaseContext>();
    dbContext.Database.Migrate();
}

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
