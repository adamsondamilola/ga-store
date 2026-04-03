using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Data.Models;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Interfaces
{
	public interface IDeliveryLocationService
	{
        Task<PaginatedServiceResponse<List<DeliveryLocationDto>>> GetAllAsync(
     string? searchTerm, string? state, string? city, string? provider, bool? isHomeDelivery,
     int pageNumber, int pageSize);
		Task<ServiceResponse<DeliveryLocationDto>> GetByIdAsync(Guid id);
		Task<ServiceResponse<DeliveryLocationDto>> GetByStateCityAsync(string State, string City);
		Task<ServiceResponse<DeliveryLocationDto>> CreateOrUpdateAsync(Guid userId, DeliveryLocationDto dto);
		Task<BulkUploadResponse<DeliveryLocationDto>> BulkUploadAsync(Guid userId, List<DeliveryLocationDto> dtos);
		Task<BulkUploadResponse<DeliveryLocationDto>> BulkUploadFromFileAsync(
		Guid userId,
		Stream fileStream,
		string fileType,
		string originalFileName);
		Task<ServiceResponse<bool>> DeleteAsync(Guid userId, Guid id);
		Task<ServiceResponse<bool>> SetActiveStatusAsync(Guid userId, Guid id, bool isActive);
	}
}
