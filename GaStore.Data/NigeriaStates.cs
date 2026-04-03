using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace GaStore.Data
{
    public class NigeriaState
    {
        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("subdivision")]
        public List<string> Subdivisions { get; set; } = new();
    }

    public static class NigeriaStates
    {
        public static readonly List<NigeriaState> States = new()
        {
            new NigeriaState
            {
                Code = "AB",
                Name = "Abia",
                Subdivisions = new List<string>
                {
                    "Aba North", "Aba South", "Arochukwu", "Bende", "Ikwuano",
                    "Isiala-Ngwa North", "Isiala-Ngwa South", "Isuikwato", "Obi Nwa",
                    "Ohafia", "Osisioma", "Ngwa", "Ugwunagbo", "Ukwa East",
                    "Ukwa West", "Umuahia North", "Umuahia South", "Umu-Neochi"
                }
            },
            new NigeriaState
            {
                Code = "FC",
                Name = "Abuja",
//                Name = "Abuja Federal Capital Territory",
                Subdivisions = new List<string>
                {
                    "Abaji", "Abuja Municipal", "Bwari", "Gwagwalada", "Kuje", "Kwali"
                }
            },
            new NigeriaState
            {
                Code = "AD",
                Name = "Adamawa",
                Subdivisions = new List<string>
                {
                    "Demsa", "Fufore", "Ganaye", "Gireri", "Gombi", "Guyuk", "Hong",
                    "Jada", "Lamurde", "Madagali", "Maiha", "Mayo-Belwa", "Michika",
                    "Mubi North", "Mubi South", "Numan", "Shelleng", "Song", "Toungo",
                    "Yola North", "Yola South"
                }
            },
            new NigeriaState
            {
                Code = "AK",
                Name = "Akwa Ibom",
                Subdivisions = new List<string>
                {
                    "Abak", "Eastern Obolo", "Eket", "Esit Eket", "Essien Udim", "Etim Ekpo",
                    "Etinan", "Ibeno", "Ibesikpo Asutan", "Ibiono Ibom", "Ika", "Ikono",
                    "Ikot Abasi", "Ikot Ekpene", "Ini", "Itu", "Mbo", "Mkpat Enin",
                    "Nsit Atai", "Nsit Ibom", "Nsit Ubium", "Obot Akara", "Okobo", "Onna",
                    "Oron", "Oruk Anam", "Udung Uko", "Ukanafun", "Uruan", "Urue-Offong/Oruko", "Uyo"
                }
            },
            new NigeriaState
            {
                Code = "AN",
                Name = "Anambra",
                Subdivisions = new List<string>
                {
                    "Aguata", "Anambra East", "Anambra West", "Anaocha", "Awka North",
                    "Awka South", "Ayamelum", "Dunukofia", "Ekwusigo", "Idemili North",
                    "Idemili South", "Ihiala", "Njikoka", "Nnewi North", "Nnewi South",
                    "Ogbaru", "Onitsha North", "Onitsha South", "Orumba North", "Orumba South", "Oyi"
                }
            },
            new NigeriaState
            {
                Code = "BA",
                Name = "Bauchi",
                Subdivisions = new List<string>
                {
                    "Alkaleri", "Bauchi", "Bogoro", "Damban", "Darazo", "Dass", "Ganjuwa",
                    "Giade", "Itas/Gadau", "Jama'are", "Katagum", "Kirfi", "Misau",
                    "Ningi", "Shira", "Tafawa-Balewa", "Toro", "Warji", "Zaki"
                }
            },
            new NigeriaState
            {
                Code = "BY",
                Name = "Bayelsa",
                Subdivisions = new List<string>
                {
                    "Brass", "Ekeremor", "Kolokuma/Opokuma", "Nembe", "Ogbia",
                    "Sagbama", "Southern Ijaw", "Yenagoa"
                }
            },
            new NigeriaState
            {
                Code = "BE",
                Name = "Benue",
                Subdivisions = new List<string>
                {
                    "Ado", "Agatu", "Apa", "Buruku", "Gboko", "Guma", "Gwer East",
                    "Gwer West", "Katsina-Ala", "Konshisha", "Kwande", "Logo", "Makurdi",
                    "Obi", "Ogbadibo", "Oju", "Okpokwu", "Ohimini", "Oturkpo", "Tarka",
                    "Ukum", "Ushongo", "Vandeikya"
                }
            },
            new NigeriaState
            {
                Code = "BO",
                Name = "Borno",
                Subdivisions = new List<string>
                {
                    "Abadam", "Askira/Uba", "Bama", "Bayo", "Biu", "Chibok", "Damboa",
                    "Dikwa", "Gubio", "Guzamala", "Gwoza", "Hawul", "Jere", "Kaga",
                    "Kala/Balge", "Konduga", "Kukawa", "Kwaya Kusar", "Mafa", "Magumeri",
                    "Maiduguri", "Marte", "Mobbar", "Monguno", "Ngala", "Nganzai", "Shani"
                }
            },
            new NigeriaState
            {
                Code = "CR",
                Name = "Cross River",
                Subdivisions = new List<string>
                {
                    "Abi", "Akamkpa", "Akpabuyo", "Bakassi", "Bekwara", "Biase", "Boki",
                    "Calabar Municipal", "Calabar South", "Etung", "Ikom", "Obubra",
                    "Obudu", "Obanliku", "Odukpani", "Ogoja", "Yala", "Yakurr"
                }
            },
            new NigeriaState
            {
                Code = "DE",
                Name = "Delta",
                Subdivisions = new List<string>
                {
                    "Aniocha North", "Aniocha South", "Bomadi", "Burutu", "Ethiope East",
                    "Ethiope West", "Ika North East", "Ika South", "Isoko North", "Isoko South",
                    "Ndokwa East", "Ndokwa West", "Okpe", "Oshimili North", "Oshimili South",
                    "Patani", "Sapele", "Udu", "Ughelli North", "Ughelli South", "Ukwuani",
                    "Uvwie", "Warri North", "Warri South", "Warri South West"
                }
            },
            new NigeriaState
            {
                Code = "EB",
                Name = "Ebonyi",
                Subdivisions = new List<string>
                {
                    "Abakaliki", "Afikpo North", "Afikpo South", "Ebonyi", "Ezza North",
                    "Ezza South", "Ishielu", "Ivo", "Izzi", "Ohaukwu", "Onicha"
                }
            },
            new NigeriaState
            {
                Code = "ED",
                Name = "Edo",
                Subdivisions = new List<string>
                {
                    "Akoko-Edo", "Egor", "Esan Central", "Esan North-East", "Esan South-East",
                    "Esan West", "Etsako Central", "Etsako East", "Etsako West", "Igueben",
                    "Ikpoba-Okha", "Oredo", "Orhionmwon", "Ovia North-East", "Ovia South-West",
                    "Owan East", "Owan West", "Uhunmwonde"
                }
            },
            new NigeriaState
            {
                Code = "EK",
                Name = "Ekiti",
                Subdivisions = new List<string>
                {
                    "Ado Ekiti", "Efon", "Ekiti East", "Ekiti South-West", "Ekiti West",
                    "Emure", "Gbonyin", "Ido-Osi", "Ijero", "Ikere", "Ikole", "Ilejemeje",
                    "Irepodun/Ifelodun", "Ise/Orun", "Moba", "Oye"
                }
            },
            new NigeriaState
            {
                Code = "EN",
                Name = "Enugu",
                Subdivisions = new List<string>
                {
                    "Aninri", "Awgu", "Enugu East", "Enugu North", "Enugu South", "Ezeagu",
                    "Igbo Etiti", "Igbo Eze North", "Igbo Eze South", "Isi Uzo", "Nkanu East",
                    "Nkanu West", "Nsukka", "Oji River", "Udenu", "Udi", "Uzo-Uwani"
                }
            },
            new NigeriaState
            {
                Code = "GO",
                Name = "Gombe",
                Subdivisions = new List<string>
                {
                    "Akko", "Balanga", "Billiri", "Dukku", "Funakaye", "Gombe",
                    "Kaltungo", "Kwami", "Nafada", "Shongom", "Yamaltu/Deba"
                }
            },
            new NigeriaState
            {
                Code = "IM",
                Name = "Imo",
                Subdivisions = new List<string>
                {
                    "Aboh Mbaise", "Ahiazu Mbaise", "Ehime Mbano", "Ezinihitte Mbaise", "Ideato North",
                    "Ideato South", "Ihitte/Uboma", "Ikeduru", "Isiala Mbano", "Isu", "Mbaitoli",
                    "Ngor Okpala", "Njaba", "Nkwerre", "Nwangele", "Obowo", "Oguta", "Ohaji/Egbema",
                    "Okigwe", "Orlu", "Orsu", "Oru East", "Oru West", "Owerri Municipal", "Owerri North", "Owerri West"
                }
            },
            new NigeriaState
            {
                Code = "JI",
                Name = "Jigawa",
                Subdivisions = new List<string>
                {
                    "Auyo", "Babura", "Biriniwa", "Birnin Kudu", "Buji", "Dutse", "Gagarawa",
                    "Garki", "Gumel", "Guri", "Gwaram", "Gwiwa", "Hadejia", "Jahun", "Kafin Hausa",
                    "Kazaure", "Kiri Kasama", "Kiyawa", "Maigatari", "Malam Madori", "Miga", "Ringim",
                    "Roni", "Sule Tankarkar", "Taura", "Yankwashi"
                }
            },
            new NigeriaState
            {
                Code = "KD",
                Name = "Kaduna",
                Subdivisions = new List<string>
                {
                    "Birnin Gwari", "Chikun", "Giwa", "Igabi", "Ikara", "Jaba", "Jema'a",
                    "Kachia", "Kaduna North", "Kaduna South", "Kagarko", "Kajuru", "Kaura",
                    "Kauru", "Kubau", "Kudan", "Lere", "Makarfi", "Sabon Gari", "Sanga",
                    "Soba", "Zangon Kataf", "Zaria"
                }
            },
            new NigeriaState
            {
                Code = "KN",
                Name = "Kano",
                Subdivisions = new List<string>
                {
                    "Ajingi", "Albasu", "Bagwai", "Bebeji", "Bichi", "Bunkure", "Dala",
                    "Dambatta", "Dawakin Kudu", "Dawakin Tofa", "Doguwa", "Fagge", "Gabasawa",
                    "Garko", "Gaya", "Gezawa", "Gwale", "Gwarzo", "Kabo", "Karaye", "Kibiya",
                    "Kiru", "Kumbotso", "Kunchi", "Kura", "Madobi", "Makoda", "Minjibir",
                    "Nasarawa", "Rano", "Rimin Gado", "Rogo", "Shanono", "Sumaila", "Takai",
                    "Tarauni", "Tofa", "Tsanyawa", "Tudun Wada", "Ungogo", "Warawa", "Wudil"
                }
            },
            new NigeriaState
            {
                Code = "KT",
                Name = "Katsina",
                Subdivisions = new List<string>
                {
                    "Bakori", "Batagarawa", "Batsari", "Baure", "Bindawa", "Charanchi", "Dan Musa",
                    "Dandume", "Danja", "Daura", "Dutsi", "Dutsin-Ma", "Faskari", "Funtua",
                    "Ingawa", "Jibia", "Kafur", "Kaita", "Kankara", "Kankia", "Katsina",
                    "Kurfi", "Kusada", "Mai'Adua", "Malumfashi", "Mani", "Mashi", "Matazu",
                    "Musawa", "Rimi", "Sabuwa", "Safana", "Sandamu", "Zango"
                }
            },
            new NigeriaState
            {
                Code = "KE",
                Name = "Kebbi",
                Subdivisions = new List<string>
                {
                    "Aleiro", "Arewa Dandi", "Argungu", "Augie", "Bagudo", "Birnin Kebbi",
                    "Bunza", "Dandi", "Fakai", "Gwandu", "Jega", "Kalgo", "Koko/Besse",
                    "Maiyama", "Ngaski", "Sakaba", "Shanga", "Suru", "Wasagu/Danko", "Yauri", "Zuru"
                }
            },
            new NigeriaState
            {
                Code = "KO",
                Name = "Kogi",
                Subdivisions = new List<string>
                {
                    "Adavi", "Ajaokuta", "Ankpa", "Bassa", "Dekina", "Ibaji", "Idah",
                    "Igalamela-Odolu", "Ijumu", "Kabba/Bunu", "Kogi", "Lokoja", "Mopa-Muro",
                    "Ofu", "Ogori/Magongo", "Okehi", "Okene", "Olamaboro", "Omala", "Yagba East", "Yagba West"
                }
            },
            new NigeriaState
            {
                Code = "KW",
                Name = "Kwara",
                Subdivisions = new List<string>
                {
                    "Asa", "Baruten", "Edu", "Ekiti", "Ifelodun", "Ilorin East", "Ilorin South",
                    "Ilorin West", "Irepodun", "Isin", "Kaiama", "Moro", "Offa", "Oke Ero",
                    "Oyun", "Patigi"
                }
            },
            new NigeriaState
            {
                Code = "LA",
                Name = "Lagos",
                Subdivisions = new List<string>
                {
                    "Agege", "Ajeromi-Ifelodun", "Alimosho", "Amuwo-Odofin", "Apapa", "Badagry",
                    "Epe", "Eti-Osa", "Ibeju-Lekki", "Ifako-Ijaiye", "Ikeja", "Ikorodu",
                    "Kosofe", "Lagos Island", "Lagos Mainland", "Mushin", "Ojo", "Oshodi-Isolo",
                    "Shomolu", "Surulere"
                }
            },
            new NigeriaState
            {
                Code = "NA",
                Name = "Nasarawa",
                Subdivisions = new List<string>
                {
                    "Akwanga", "Awe", "Doma", "Karu", "Keana", "Keffi", "Kokona",
                    "Lafia", "Nasarawa", "Nasarawa Egon", "Obi", "Toto", "Wamba"
                }
            },
            new NigeriaState
            {
                Code = "NI",
                Name = "Niger",
                Subdivisions = new List<string>
                {
                    "Agaie", "Agwara", "Bida", "Borgu", "Bosso", "Chanchaga", "Edati",
                    "Gbako", "Gurara", "Katcha", "Kontagora", "Lapai", "Lavun", "Magama",
                    "Mariga", "Mashegu", "Mokwa", "Munya", "Paikoro", "Rafi", "Rijau",
                    "Shiroro", "Suleja", "Tafa", "Wushishi"
                }
            },
            new NigeriaState
            {
                Code = "OG",
                Name = "Ogun",
                Subdivisions = new List<string>
                {
                    "Abeokuta North", "Abeokuta South", "Ado-Odo/Ota", "Ewekoro", "Ifo",
                    "Ijebu East", "Ijebu North", "Ijebu North East", "Ijebu Ode", "Ikenne",
                    "Imeko Afon", "Ipokia", "Obafemi-Owode", "Odeda", "Odogbolu", "Ogun Waterside",
                    "Remo North", "Sagamu", "Yewa North", "Yewa South"
                }
            },
            new NigeriaState
            {
                Code = "ON",
                Name = "Ondo",
                Subdivisions = new List<string>
                {
                    "Akoko North-East", "Akoko North-West", "Akoko South-East", "Akoko South-West",
                    "Akure North", "Akure South", "Ese Odo", "Idanre", "Ifedore", "Ilaje",
                    "Ile Oluji/Okeigbo", "Irele", "Odigbo", "Okitipupa", "Ondo East", "Ondo West",
                    "Ose", "Owo"
                }
            },
            new NigeriaState
            {
                Code = "OS",
                Name = "Osun",
                Subdivisions = new List<string>
                {
                    "Aiyedaade", "Aiyedire", "Atakumosa East", "Atakumosa West", "Boluwaduro",
                    "Boripe", "Ede North", "Ede South", "Egbedore", "Ejigbo", "Ife Central",
                    "Ife East", "Ife North", "Ife South", "Ifedayo", "Ifelodun", "Ila", "Ilesa East",
                    "Ilesa West", "Irepodun", "Irewole", "Isokan", "Iwo", "Obokun", "Odo Otin",
                    "Ola Oluwa", "Olorunda", "Oriade", "Orolu", "Osogbo"
                }
            },
            new NigeriaState
            {
                Code = "OY",
                Name = "Oyo",
                Subdivisions = new List<string>
                {
                    "Afijio", "Akinyele", "Atiba", "Atisbo", "Egbeda", "Ibadan North", "Ibadan North-East",
                    "Ibadan North-West", "Ibadan South-East", "Ibadan South-West", "Ibarapa Central",
                    "Ibarapa East", "Ibarapa North", "Ido", "Irepo", "Iseyin", "Itesiwaju", "Iwajowa",
                    "Kajola", "Lagelu", "Ogbomosho North", "Ogbomosho South", "Ogo Oluwa", "Olorunsogo",
                    "Oluyole", "Ona Ara", "Orelope", "Oriire", "Oyo East", "Oyo West", "Saki East",
                    "Saki West", "Surulere"
                }
            },
            new NigeriaState
            {
                Code = "PL",
                Name = "Plateau",
                Subdivisions = new List<string>
                {
                    "Barkin Ladi", "Bassa", "Bokkos", "Jos East", "Jos North", "Jos South",
                    "Kanam", "Kanke", "Langtang North", "Langtang South", "Mangu", "Mikang",
                    "Pankshin", "Qua'an Pan", "Riyom", "Shendam", "Wase"
                }
            },
            new NigeriaState
            {
                Code = "RI",
                Name = "Rivers",
                Subdivisions = new List<string>
                {
                    "Abua/Odual", "Ahoada East", "Ahoada West", "Akuku-Toru", "Andoni", "Asari-Toru",
                    "Bonny", "Degema", "Eleme", "Emuoha", "Etche", "Gokana", "Ikwerre", "Khana",
                    "Obio/Akpor", "Ogba/Egbema/Ndoni", "Ogu/Bolo", "Okrika", "Omuma", "Opobo/Nkoro",
                    "Oyigbo", "Port Harcourt", "Tai"
                }
            },
            new NigeriaState
            {
                Code = "SO",
                Name = "Sokoto",
                Subdivisions = new List<string>
                {
                    "Binji", "Bodinga", "Dange-Shuni", "Gada", "Goronyo", "Gudu", "Gwadabawa",
                    "Illela", "Isa", "Kebbe", "Kware", "Rabah", "Sabon Birni", "Shagari",
                    "Silame", "Sokoto North", "Sokoto South", "Tambuwal", "Tangaza", "Tureta",
                    "Wamako", "Wurno", "Yabo"
                }
            },
            new NigeriaState
            {
                Code = "TA",
                Name = "Taraba",
                Subdivisions = new List<string>
                {
                    "Ardo Kola", "Bali", "Donga", "Gashaka", "Gassol", "Ibi", "Jalingo",
                    "Karim Lamido", "Kurmi", "Lau", "Sardauna", "Takum", "Ussa", "Wukari",
                    "Yorro", "Zing"
                }
            },
            new NigeriaState
            {
                Code = "YO",
                Name = "Yobe",
                Subdivisions = new List<string>
                {
                    "Bade", "Bursari", "Damaturu", "Fika", "Fune", "Geidam", "Gujba",
                    "Gulani", "Jakusko", "Karasuwa", "Machina", "Nangere", "Nguru",
                    "Potiskum", "Tarmuwa", "Yunusari", "Yusufari"
                }
            },
            new NigeriaState
            {
                Code = "ZA",
                Name = "Zamfara",
                Subdivisions = new List<string>
                {
                    "Anka", "Bakura", "Birnin Magaji/Kiyaw", "Bukkuyum", "Bungudu", "Gummi",
                    "Gusau", "Kaura Namoda", "Maradun", "Maru", "Shinkafi", "Talata Mafara",
                    "Tsafe", "Zurmi"
                }
            }
        };
    }
}