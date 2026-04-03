using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.UsersDto;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces
{
    public interface IAuthGoogleService
    {
        Task<ServiceResponse<string>> AuthenticateGoogleUserAsync(GoogleUserDto googleUser);
    }
}
