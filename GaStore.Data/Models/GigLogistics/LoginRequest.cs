using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace GaStore.Data.Models.GigLogistics
{
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class LoginRequestAlt
    {
        public string email { get; set; }
        public string password { get; set; }
    }

    public class LoginResponse
    {
        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("apiId")]
        public string ApiId { get; set; }

        [JsonProperty("status")]
        public int Status { get; set; }

        [JsonProperty("data")]
        public LoginData Data { get; set; }
    }

    public class LoginData
    {
        [JsonProperty("_id")]
        public string MongoId { get; set; }

        [JsonProperty("Id")]
        public string Id { get; set; }

        [JsonProperty("FirstName")]
        public string FirstName { get; set; }

        [JsonProperty("LastName")]
        public string LastName { get; set; }

        [JsonProperty("Gender")]
        public int Gender { get; set; }

        [JsonProperty("Designation")]
        public string Designation { get; set; }

        [JsonProperty("Department")]
        public string Department { get; set; }

        [JsonProperty("PictureUrl")]
        public string PictureUrl { get; set; }

        [JsonProperty("IsActive")]
        public bool IsActive { get; set; }

        [JsonProperty("Organisation")]
        public string Organisation { get; set; }

        [JsonProperty("Status")]
        public int Status { get; set; }

        [JsonProperty("UserType")]
        public int UserType { get; set; }

        [JsonProperty("DateCreated")]
        public DateTime DateCreated { get; set; }

        [JsonProperty("DateModified")]
        public DateTime DateModified { get; set; }

        [JsonProperty("IsDeleted")]
        public bool IsDeleted { get; set; }

        [JsonProperty("SystemUserId")]
        public string SystemUserId { get; set; }

        [JsonProperty("SystemUserRole")]
        public string SystemUserRole { get; set; }

        [JsonProperty("Email")]
        public string Email { get; set; }

        [JsonProperty("EmailConfirmed")]
        public bool EmailConfirmed { get; set; }

        [JsonProperty("PhoneNumber")]
        public string PhoneNumber { get; set; }

        [JsonProperty("PhoneNumberConfirmed")]
        public bool PhoneNumberConfirmed { get; set; }

        [JsonProperty("UserName")]
        public string UserName { get; set; }

        [JsonProperty("UserChannelCode")]
        public string UserChannelCode { get; set; }

        [JsonProperty("UserChannelPassword")]
        public string UserChannelPassword { get; set; }

        [JsonProperty("UserChannelType")]
        public int UserChannelType { get; set; }

        [JsonProperty("UserActiveCountryId")]
        public int UserActiveCountryId { get; set; }

        [JsonProperty("AppType")]
        public string AppType { get; set; }

        [JsonProperty("IsMagaya")]
        public bool IsMagaya { get; set; }

        [JsonProperty("IsInternational")]
        public bool IsInternational { get; set; }

        [JsonProperty("CountryType")]
        public string CountryType { get; set; }

        [JsonProperty("Claim")]
        public string Claim { get; set; }

        [JsonProperty("access-token")]
        public string AccessToken { get; set; }

        // Derived or convenience properties
        [JsonIgnore]
        public string FullName => $"{FirstName} {LastName}";
    }

}
