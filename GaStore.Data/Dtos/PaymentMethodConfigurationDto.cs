namespace GaStore.Data.Dtos
{
    public class PaymentMethodConfigurationDto
    {
        public Guid? Id { get; set; }
        public string MethodKey { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public bool IsDefaultGateway { get; set; }
        public bool IsGateway { get; set; }
        public int SortOrder { get; set; }
    }

    public class UpdatePaymentMethodConfigurationDto
    {
        public string MethodKey { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public bool IsDefaultGateway { get; set; }
    }
}
