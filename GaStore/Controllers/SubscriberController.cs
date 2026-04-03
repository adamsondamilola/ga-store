using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using GaStore.Common;
using GaStore.Core.Services.Interfaces;
using GaStore.Data.Dtos.SubscribersDto;
using static GaStore.Data.Dtos.UsersDto.UserRolesDto;

namespace GaStore.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriberController : RootController
    {
        private readonly ISubscriberService _subscriberService;

        public SubscriberController(ISubscriberService subscriberService)
        {
            _subscriberService = subscriberService;
        }

        /// <summary>
        /// Subscribe to newsletter
        /// </summary>
        [HttpPost("subscribe")]
        [AllowAnonymous]
        public async Task<IActionResult> Subscribe([FromBody] CreateSubscriberDto subscriberDto)
        {
            var response = await _subscriberService.SubscribeAsync(subscriberDto);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Get all subscribers (paginated)
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet]
        public async Task<IActionResult> GetAllSubscribers(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchEmail = null,
            [FromQuery] bool? isActive = null)
        {
            var response = await _subscriberService.GetAllSubscribersAsync(
                pageNumber,
                pageSize,
                searchEmail ?? "",
                isActive);

            return StatusCode(response.Status, response);
        }

        /// <summary>
        /// Get subscriber by ID
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("{subscriberId}")]
        public async Task<IActionResult> GetById(Guid subscriberId)
        {
            var response = await _subscriberService.GetByIdAsync(subscriberId);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Get subscriber by email
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var response = await _subscriberService.GetByEmailAsync(email);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Update subscription status
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpPut("{subscriberId}")]
        public async Task<IActionResult> UpdateSubscription(
            Guid subscriberId,
            [FromBody] UpdateSubscriberDto updateDto)
        {
            var response = await _subscriberService.UpdateSubscriptionAsync(subscriberId, updateDto);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Unsubscribe by ID
        /// </summary>
        [Authorize(Roles = CustomRoles.Admin)]
        [HttpDelete("{subscriberId}")]
        public async Task<IActionResult> Unsubscribe(Guid subscriberId)
        {
            var response = await _subscriberService.UnsubscribeAsync(subscriberId);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Unsubscribe by email (public endpoint)
        /// </summary>
        [HttpPost("unsubscribe")]
        [AllowAnonymous]
        public async Task<IActionResult> UnsubscribeByEmail([FromBody] string email)
        {
            var response = await _subscriberService.UnsubscribeByEmailAsync(email);
            return StatusCode(response.StatusCode, response);
        }

        /// <summary>
        /// Check subscription status by email (public endpoint)
        /// </summary>
        [HttpGet("status/{email}")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckSubscriptionStatus(string email)
        {
            var response = await _subscriberService.GetByEmailAsync(email);

            if (response.StatusCode != 200)
            {
                return StatusCode(response.StatusCode, new
                {
                    IsSubscribed = false,
                    Message = "Email not found in our subscription list"
                });
            }

            return Ok(new
            {
                IsSubscribed = response.Data.IsActive,
                SubscriptionDate = response.Data.DateCreated,
                Message = response.Data.IsActive ?
                    "Email is subscribed" :
                    "Email was subscribed but is now inactive"
            });
        }
    }
}