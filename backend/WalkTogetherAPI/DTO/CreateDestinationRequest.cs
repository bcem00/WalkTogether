namespace WalkTogetherAPI.DTO
{
    public class CreateDestinationRequest
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public int OrderInRoute { get; set; }
    }
}
