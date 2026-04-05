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
    [Route("api/admin")]
    [Authorize(Roles = CustomRoles.Admin)]
    public class AdminModerationController : RootController
    {
        private readonly IVendorKycService _vendorKycService;
        private readonly IVendorProductService _vendorProductService;

        public AdminModerationController(IVendorKycService vendorKycService, IVendorProductService vendorProductService)
        {
            _vendorKycService = vendorKycService;
            _vendorProductService = vendorProductService;
        }

        [HttpGet("kyc/pending")]
        public async Task<ActionResult<PaginatedServiceResponse<List<VendorKycDto>>>> GetPendingKyc(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _vendorKycService.GetPendingKycAsync(pageNumber, pageSize);
            return StatusCode(response.Status, response);
        }

        [HttpPost("kyc/{id:guid}/approve")]
        public async Task<ActionResult<ServiceResponse<VendorKycDto>>> ApproveKyc(Guid id)
        {
            var response = await _vendorKycService.ApproveKycAsync(id, UserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("kyc/{id:guid}/reject")]
        public async Task<ActionResult<ServiceResponse<VendorKycDto>>> RejectKyc(Guid id, [FromBody] VendorModerationDecisionDto dto)
        {
            var response = await _vendorKycService.RejectKycAsync(id, UserId, dto?.Reason);
            return StatusCode(response.StatusCode, response);
        }

        [HttpGet("products/pending")]
        public async Task<ActionResult<PaginatedServiceResponse<List<ProductDto>>>> GetPendingProducts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            var response = await _vendorProductService.GetPendingProductsAsync(pageNumber, pageSize);
            return StatusCode(response.Status, response);
        }

        [HttpPost("products/{id:guid}/approve")]
        public async Task<ActionResult<ServiceResponse<ProductDto>>> ApproveProduct(Guid id)
        {
            var response = await _vendorProductService.ApproveProductAsync(id, UserId);
            return StatusCode(response.StatusCode, response);
        }

        [HttpPost("products/{id:guid}/reject")]
        public async Task<ActionResult<ServiceResponse<ProductDto>>> RejectProduct(Guid id, [FromBody] ProductModerationDecisionDto dto)
        {
            var response = await _vendorProductService.RejectProductAsync(id, UserId, dto?.Reason);
            return StatusCode(response.StatusCode, response);
        }
    }
}
