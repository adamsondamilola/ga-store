using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.Google;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces.Google
{
    public interface IGoogleMapService
    {
        Task<ServiceResponse<IEnumerable<GooglePlaceDto>>> SearchPlacesAsync(string query, string location = null, int radius = 1000);
        Task<ServiceResponse<GooglePlaceDto>> GetPlaceDetailsAsync(string placeId);

    }
}
