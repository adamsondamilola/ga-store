using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using GaStore.Data.Dtos.MessagingDto;
using GaStore.Shared;

namespace GaStore.Core.Services.SMS
{
    public interface ITermiiSmsService
    {
        Task<ServiceResponse<MessageDto>> SendMessageAsync(MessageDto message);
    }
}
