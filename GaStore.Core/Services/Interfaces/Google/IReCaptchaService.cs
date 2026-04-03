using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Shared;

namespace GaStore.Core.Services.Interfaces.Google
{
    public interface IRecaptchaService
    {
        Task<ServiceResponse<bool>> VerifyAsync(string token);
    }

}
