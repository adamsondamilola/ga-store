using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/vendor")]
    [Authorize(Roles = $"{CustomRoles.User},{CustomRoles.Vendor},{CustomRoles.Admin},{CustomRoles.SuperAdmin}")]
    public class VendorController : RootController
    {
        private readonly IVendorKycService _vendorKycService;
        private readonly IVendorProductService _vendorProductService;

        public VendorController(IVendorKycService vendorKycService, IVendorProductService vendorProductService)
        {
            _vendorKycService = vendorKycService;
            _vendorProductService = vendorProductService;
        }

        [HttpPost("account/become-vendor")]
        public async Task<ActionResult<ServiceResponse<VendorKycStatusDto>>> BecomeVendor()
        {
            var response = await _vendorKycService.BecomeVendorAsync(UserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("kyc/submit")]
        public async Task<ActionResult<ServiceResponse<VendorKycDto>>> SubmitKyc([FromForm] VendorKycUpsertDto dto)
        {
            var response = await _vendorKycService.UpsertKycAsync(UserId, dto, true);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("kyc/status")]
        public async Task<ActionResult<ServiceResponse<VendorKycStatusDto>>> GetKycStatus()
        {
            var response = await _vendorKycService.GetStatusAsync(UserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPut("kyc/update")]
        public async Task<ActionResult<ServiceResponse<VendorKycDto>>> UpdateKyc([FromForm] VendorKycUpsertDto dto)
        {
            var response = await _vendorKycService.UpsertKycAsync(UserId, dto, dto.SubmitForReview);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("products")]
        public async Task<ActionResult<PaginatedServiceResponse<List<ProductDto>>>> GetVendorProducts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _vendorProductService.GetVendorProductsAsync(UserId, pageNumber, pageSize);
            return StatusCode(response.Status, response);
        }

        [HttpPost("products")]
        public async Task<ActionResult<ServiceResponse<ProductDto>>> CreateVendorProduct([FromForm] ProductDto dto)
        {
            var response = await _vendorProductService.CreateVendorProductAsync(dto, UserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPut("products/{id:guid}")]
        public async Task<ActionResult<ServiceResponse<ProductDto>>> UpdateVendorProduct(Guid id, [FromForm] ProductDto dto)
        {
            var response = await _vendorProductService.UpdateVendorProductAsync(id, dto, UserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("products/{id:guid}/submit-for-review")]
        public async Task<ActionResult<ServiceResponse<ProductDto>>> SubmitProductForReview(Guid id)
        {
            var response = await _vendorProductService.SubmitForReviewAsync(id, UserId);
            return StatusCode(response.StatusCode, response);
        }
    }
}
