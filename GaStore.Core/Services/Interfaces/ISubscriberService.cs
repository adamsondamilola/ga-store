using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using GaStore.Data.Dtos.SubscribersDto;
using GaStore.Data.Entities.Subscribers;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface ISubscriberService
    {
        Task<ServiceResponse<Subscriber>> SubscribeAsync(CreateSubscriberDto subscriberDto);
        Task<ServiceResponse<Subscriber>> GetByIdAsync(Guid subscriberId);
        Task<ServiceResponse<Subscriber>> GetByEmailAsync(string email);
        Task<ServiceResponse<Subscriber>> UpdateSubscriptionAsync(Guid subscriberId, UpdateSubscriberDto updateDto);
        Task<ServiceResponse<string>> UnsubscribeAsync(Guid subscriberId);
        Task<ServiceResponse<string>> UnsubscribeByEmailAsync(string email);
        Task<PaginatedServiceResponse<List<SubscriberDto>>> GetAllSubscribersAsync(
            int pageNumber,
            int pageSize,
            string searchEmail = null,
            bool? isActive = null);
    }
}