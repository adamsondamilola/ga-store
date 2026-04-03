namespace GaStore.Data.Entities.System
{
    public class PaymentMethodConfiguration : EntityBase
    {
        public string MethodKey { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool IsEnabled { get; set; } = true;
        public bool IsDefaultGateway { get; set; } = false;
        public bool IsGateway { get; set; } = false;
        public int SortOrder { get; set; } = 0;
    }
}
