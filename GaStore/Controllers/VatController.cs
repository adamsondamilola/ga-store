using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.ProductsDto;
using GaStore.Shared;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class VatController : RootController
	{
		private readonly IVatService _vatService;

		public VatController(IVatService vatService)
		{
			_vatService = vatService;
		}

		// GET: api/Vat
		[HttpGet]
		public async Task<ActionResult<PaginatedServiceResponse<List<VatDto>>>> GetAllVats(
			[FromQuery] int pageNumber = 1,
			[FromQuery] int pageSize = 10,
			[FromQuery] bool? isActive = null)
		{
			var response = await _vatService.GetAllVatsAsync(pageNumber, pageSize, isActive);

			if (response.Status == 200)
			{
				return Ok(response);
			}

			return StatusCode(response.Status, response);
		}

		// GET: api/Vat/active
		[HttpGet("active")]
		public async Task<ActionResult<ServiceResponse<VatDto>>> GetActiveVat()
		{
			var response = await _vatService.GetActiveVatAsync();

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}
			else if (response.StatusCode == 404)
			{
				return NotFound(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		// GET: api/Vat/5
		[HttpGet("{id}")]
		public async Task<ActionResult<ServiceResponse<VatDto>>> GetVat(Guid id)
		{
			var response = await _vatService.GetByIdAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}
			else if (response.StatusCode == 404)
			{
				return NotFound(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// POST: api/Vat
		[HttpPost]
		public async Task<ActionResult<ServiceResponse<VatDto>>> CreateVat([FromBody] VatDto vatDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<VatDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			var response = await _vatService.CreateAsync(vatDto);

			if (response.StatusCode == 201)
			{
				return CreatedAtAction(nameof(GetVat), new { id = response.Data?.Id }, response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// PUT: api/Vat/5
		[HttpPut("{id}")]
		public async Task<ActionResult<ServiceResponse<VatDto>>> UpdateVat(Guid id, [FromBody] VatDto vatDto)
		{
			if (!ModelState.IsValid)
			{
				return BadRequest(new ServiceResponse<VatDto>
				{
					StatusCode = 400,
					Message = "Invalid input data."
				});
			}

			if (id != vatDto.Id)
			{
				return BadRequest(new ServiceResponse<VatDto>
				{
					StatusCode = 400,
					Message = "ID in the URL does not match ID in the request body."
				});
			}

			var response = await _vatService.UpdateAsync(vatDto);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}
			else if (response.StatusCode == 404)
			{
				return NotFound(response);
			}

			return StatusCode(response.StatusCode, response);
		}

		[Authorize(Roles = CustomRoles.Admin)]
		// DELETE: api/Vat/5
		[HttpDelete("{id}")]
		public async Task<ActionResult<ServiceResponse<string>>> DeleteVat(Guid id)
		{
			var response = await _vatService.DeleteAsync(id);

			if (response.StatusCode == 200)
			{
				return Ok(response);
			}
			else if (response.StatusCode == 404)
			{
				return NotFound(response);
			}

			return StatusCode(response.StatusCode, response);
		}
	}
}