using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.SubscribersDto;
using GaStore.Data.Entities.Subscribers;
using GaStore.Infrastructure.Repository.UnitOfWork;
using GaStore.Models.Database;
using GaStore.Shared;
using GaStore.Shared.Constants;

namespace GaStore.Core.Services.Implementations
{
    public class SubscriberService : ISubscriberService
    {
        private readonly DatabaseContext _context;
        private readonly ILogger<SubscriberService> _logger;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public SubscriberService(
            DatabaseContext context,
            ILogger<SubscriberService> logger,
            IMapper mapper,
            IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
            _emailService = emailService;
        }

        public async Task<ServiceResponse<Subscriber>> SubscribeAsync(CreateSubscriberDto subscriberDto)
        {
            var response = new ServiceResponse<Subscriber>();

            try
            {
                // Check if email already exists
                var existingSubscriber = await _context.Subscribers
                    .FirstOrDefaultAsync(s => s.Email == subscriberDto.Email);

                if (existingSubscriber != null)
                {
                    if (existingSubscriber.IsActive)
                    {
                        response.StatusCode = 400;
                        response.Message = "This email is already subscribed.";
                        return response;
                    }

                    // Reactivate existing subscription
                    existingSubscriber.IsActive = true;
                    existingSubscriber.SubscriptionSource = subscriberDto.SubscriptionSource;
                    existingSubscriber.DateUpdated = DateTime.Now;

                    _context.Subscribers.Update(existingSubscriber);
                    await _context.SaveChangesAsync();

                    response.StatusCode = 200;
                    response.Message = "Subscription reactivated successfully";
                    response.Data = existingSubscriber;
                    return response;
                }

                // Create new subscription
                var subscriber = _mapper.Map<Subscriber>(subscriberDto);
                subscriber.DateCreated = DateTime.Now;
                subscriber.IsActive = true;

                await _context.Subscribers.AddAsync(subscriber);
                await _context.SaveChangesAsync();

                response.StatusCode = 201;
                response.Message = "Subscribed successfully";
                response.Data = subscriber;

                //send mail
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating subscription");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<Subscriber>> GetByIdAsync(Guid subscriberId)
        {
            var response = new ServiceResponse<Subscriber>();

            try
            {
                var subscriber = await _context.Subscribers
                    .FirstOrDefaultAsync(s => s.Id == subscriberId);

                if (subscriber == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Subscriber not found";
                    return response;
                }

                response.StatusCode = 200;
                response.Data = subscriber;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subscriber");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<Subscriber>> GetByEmailAsync(string email)
        {
            var response = new ServiceResponse<Subscriber>();

            try
            {
                var subscriber = await _context.Subscribers
                    .FirstOrDefaultAsync(s => s.Email == email);

                if (subscriber == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Subscriber not found";
                    return response;
                }

                response.StatusCode = 200;
                response.Data = subscriber;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subscriber by email");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<Subscriber>> UpdateSubscriptionAsync(Guid subscriberId, UpdateSubscriberDto updateDto)
        {
            var response = new ServiceResponse<Subscriber>();

            try
            {
                var subscriber = await _context.Subscribers
                    .FirstOrDefaultAsync(s => s.Id == subscriberId);

                if (subscriber == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Subscriber not found";
                    return response;
                }

                subscriber.IsActive = updateDto.IsActive;

                _context.Subscribers.Update(subscriber);
                await _context.SaveChangesAsync();

                response.StatusCode = 200;
                response.Message = "Subscription updated successfully";
                response.Data = subscriber;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating subscription");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<string>> UnsubscribeAsync(Guid subscriberId)
        {
            var response = new ServiceResponse<string>();

            try
            {
                var subscriber = await _context.Subscribers
                    .FirstOrDefaultAsync(s => s.Id == subscriberId);

                if (subscriber == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Subscriber not found";
                    return response;
                }

                subscriber.IsActive = false;

                _context.Subscribers.Update(subscriber);
                await _context.SaveChangesAsync();

                response.StatusCode = 200;
                response.Message = "Unsubscribed successfully";

                //send mail
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unsubscribing");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<ServiceResponse<string>> UnsubscribeByEmailAsync(string email)
        {
            var response = new ServiceResponse<string>();

            try
            {
                var subscriber = await _context.Subscribers
                    .FirstOrDefaultAsync(s => s.Email == email);

                if (subscriber == null)
                {
                    response.StatusCode = 404;
                    response.Message = "Subscriber not found";
                    return response;
                }

                subscriber.IsActive = false;

                _context.Subscribers.Update(subscriber);
                await _context.SaveChangesAsync();

                response.StatusCode = 200;
                response.Message = "Unsubscribed successfully";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error unsubscribing by email");
                response.StatusCode = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }

        public async Task<PaginatedServiceResponse<List<SubscriberDto>>> GetAllSubscribersAsync(
            int pageNumber,
            int pageSize,
            string? searchEmail = null,
            bool? isActive = null)
        {
            var response = new PaginatedServiceResponse<List<SubscriberDto>>();

            try
            {
                // Validate pagination parameters
                if (pageNumber < 1) pageNumber = 1;
                if (pageSize < 1) pageSize = 10;

                var query = _context.Subscribers.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(searchEmail))
                {
                    query = query.Where(s => s.Email.Contains(searchEmail));
                }

                if (isActive.HasValue)
                {
                    query = query.Where(s => s.IsActive == isActive.Value);
                }

                // Get total count
                response.TotalRecords = await query.CountAsync();

                // Apply pagination
                var subscribers = await query
                    .OrderByDescending(s => s.DateCreated)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                // Map to DTO
                var subscriberDtos = _mapper.Map<List<SubscriberDto>>(subscribers);

                response.Status = 200;
                response.Message = "Subscribers retrieved successfully";
                response.Data = subscriberDtos;
                response.PageNumber = pageNumber;
                response.PageSize = pageSize;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subscribers");
                response.Status = 500;
                response.Message = ErrorMessages.InternalServerError;
            }

            return response;
        }
    }
}