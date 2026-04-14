export interface CarModel {
  name: string;
  series?: string;
}

export interface CarMake {
  name: string;
  models: CarModel[];
}

export const CAR_CATALOG: CarMake[] = [
  {
    "name": "ГАЗ",
    "models": [
      {
        "name": "Волга"
      },
      {
        "name": "Газель"
      },
      {
        "name": "Газель Next"
      },
      {
        "name": "Газель NN"
      },
      {
        "name": "Соболь"
      },
      {
        "name": "Соболь NN"
      }
    ]
  },
  {
    "name": "Москвич",
    "models": [
      {
        "name": "3"
      },
      {
        "name": "3e"
      },
      {
        "name": "6"
      }
    ]
  },
  {
    "name": "Abarth",
    "models": [
      {
        "name": "124 Spider"
      },
      {
        "name": "500"
      },
      {
        "name": "500C"
      },
      {
        "name": "595"
      },
      {
        "name": "595 Competizione"
      },
      {
        "name": "595 Turismo"
      },
      {
        "name": "595C"
      },
      {
        "name": "695"
      },
      {
        "name": "695C"
      },
      {
        "name": "Grande Punto"
      },
      {
        "name": "Punto Evo"
      }
    ]
  },
  {
    "name": "AC",
    "models": []
  },
  {
    "name": "Acura",
    "models": [
      {
        "name": "MDX"
      },
      {
        "name": "NSX"
      },
      {
        "name": "RL"
      },
      {
        "name": "RSX"
      },
      {
        "name": "TL"
      },
      {
        "name": "TSX"
      }
    ]
  },
  {
    "name": "Aixam",
    "models": [
      {
        "name": "City"
      },
      {
        "name": "Crossline"
      },
      {
        "name": "Roadline"
      },
      {
        "name": "Scouty R"
      }
    ]
  },
  {
    "name": "Alfa Romeo",
    "models": [
      {
        "name": "4C"
      },
      {
        "name": "8C"
      },
      {
        "name": "Alfa 145"
      },
      {
        "name": "Alfa 146"
      },
      {
        "name": "Alfa 147"
      },
      {
        "name": "Alfa 155"
      },
      {
        "name": "Alfa 156"
      },
      {
        "name": "Alfa 159"
      },
      {
        "name": "Alfa 164"
      },
      {
        "name": "Alfa 166"
      },
      {
        "name": "Alfa 33"
      },
      {
        "name": "Alfa 75"
      },
      {
        "name": "Alfa 90"
      },
      {
        "name": "Alfasud"
      },
      {
        "name": "Alfetta"
      },
      {
        "name": "Brera"
      },
      {
        "name": "Crosswagon"
      },
      {
        "name": "Giulia"
      },
      {
        "name": "Giulietta"
      },
      {
        "name": "GT"
      },
      {
        "name": "GTV"
      },
      {
        "name": "Junior"
      },
      {
        "name": "MiTo"
      },
      {
        "name": "Spider"
      },
      {
        "name": "Sprint"
      },
      {
        "name": "Stelvio"
      }
    ]
  },
  {
    "name": "ALPINA",
    "models": [
      {
        "name": "B10"
      },
      {
        "name": "B12"
      },
      {
        "name": "B3"
      },
      {
        "name": "B4"
      },
      {
        "name": "B5"
      },
      {
        "name": "B6"
      },
      {
        "name": "B7"
      },
      {
        "name": "B8"
      },
      {
        "name": "D10"
      },
      {
        "name": "D3"
      },
      {
        "name": "D4"
      },
      {
        "name": "D5"
      },
      {
        "name": "Roadster S"
      },
      {
        "name": "XD3"
      },
      {
        "name": "XD4"
      }
    ]
  },
  {
    "name": "Artega",
    "models": [
      {
        "name": "GT"
      }
    ]
  },
  {
    "name": "Asia Motors",
    "models": [
      {
        "name": "Rocsta"
      }
    ]
  },
  {
    "name": "Aston Martin",
    "models": [
      {
        "name": "AR1"
      },
      {
        "name": "Cygnet"
      },
      {
        "name": "DB"
      },
      {
        "name": "DB11"
      },
      {
        "name": "DB7"
      },
      {
        "name": "DB9"
      },
      {
        "name": "DBS"
      },
      {
        "name": "Lagonda"
      },
      {
        "name": "Rapide"
      },
      {
        "name": "V12 Vantage"
      },
      {
        "name": "V8 Vantage"
      },
      {
        "name": "Vanquish"
      },
      {
        "name": "Virage"
      }
    ]
  },
  {
    "name": "Audi",
    "models": [
      {
        "name": "100"
      },
      {
        "name": "200"
      },
      {
        "name": "80"
      },
      {
        "name": "90"
      },
      {
        "name": "A1"
      },
      {
        "name": "A2"
      },
      {
        "name": "A3"
      },
      {
        "name": "A4"
      },
      {
        "name": "A4 Allroad"
      },
      {
        "name": "A5"
      },
      {
        "name": "A6"
      },
      {
        "name": "A6 Allroad"
      },
      {
        "name": "A7"
      },
      {
        "name": "A8"
      },
      {
        "name": "Cabriolet"
      },
      {
        "name": "Coupé"
      },
      {
        "name": "e-tron"
      },
      {
        "name": "Q1"
      },
      {
        "name": "Q2"
      },
      {
        "name": "Q3"
      },
      {
        "name": "Q5"
      },
      {
        "name": "Q7"
      },
      {
        "name": "Q8"
      },
      {
        "name": "quattro"
      },
      {
        "name": "R8"
      },
      {
        "name": "RS2"
      },
      {
        "name": "RS3"
      },
      {
        "name": "RS4"
      },
      {
        "name": "RS5"
      },
      {
        "name": "RS6"
      },
      {
        "name": "RS7"
      },
      {
        "name": "RSQ3"
      },
      {
        "name": "S1"
      },
      {
        "name": "S2"
      },
      {
        "name": "S3"
      },
      {
        "name": "S4"
      },
      {
        "name": "S5"
      },
      {
        "name": "S6"
      },
      {
        "name": "S7"
      },
      {
        "name": "S8"
      },
      {
        "name": "SQ2"
      },
      {
        "name": "SQ5"
      },
      {
        "name": "SQ7"
      },
      {
        "name": "SQ8"
      },
      {
        "name": "TT",
        "series": "TT"
      },
      {
        "name": "TT RS",
        "series": "TT"
      },
      {
        "name": "TTS",
        "series": "TT"
      },
      {
        "name": "V8"
      }
    ]
  },
  {
    "name": "Austin",
    "models": []
  },
  {
    "name": "Austin Healey",
    "models": []
  },
  {
    "name": "Bentley",
    "models": [
      {
        "name": "Arnage"
      },
      {
        "name": "Azure"
      },
      {
        "name": "Bentayga"
      },
      {
        "name": "Brooklands"
      },
      {
        "name": "Continental",
        "series": "Continental"
      },
      {
        "name": "Continental Flying Spur",
        "series": "Continental"
      },
      {
        "name": "Continental GT",
        "series": "Continental"
      },
      {
        "name": "Continental GTC",
        "series": "Continental"
      },
      {
        "name": "Continental Supersports",
        "series": "Continental"
      },
      {
        "name": "Eight"
      },
      {
        "name": "Flying Spur"
      },
      {
        "name": "Mulsanne"
      },
      {
        "name": "Turbo R"
      },
      {
        "name": "Turbo RT"
      },
      {
        "name": "Turbo S"
      }
    ]
  },
  {
    "name": "BMW",
    "models": [
      {
        "name": "114",
        "series": "1 Series"
      },
      {
        "name": "116",
        "series": "1 Series"
      },
      {
        "name": "118",
        "series": "1 Series"
      },
      {
        "name": "120",
        "series": "1 Series"
      },
      {
        "name": "123",
        "series": "1 Series"
      },
      {
        "name": "125",
        "series": "1 Series"
      },
      {
        "name": "130",
        "series": "1 Series"
      },
      {
        "name": "135",
        "series": "1 Series"
      },
      {
        "name": "1er M Coupé",
        "series": "1 Series"
      },
      {
        "name": "2002"
      },
      {
        "name": "214 Active Tourer",
        "series": "2 Series"
      },
      {
        "name": "214 Gran Tourer",
        "series": "2 Series"
      },
      {
        "name": "216",
        "series": "2 Series"
      },
      {
        "name": "216 Active Tourer",
        "series": "2 Series"
      },
      {
        "name": "216 Gran Tourer",
        "series": "2 Series"
      },
      {
        "name": "218",
        "series": "2 Series"
      },
      {
        "name": "218 Active Tourer",
        "series": "2 Series"
      },
      {
        "name": "218 Gran Tourer",
        "series": "2 Series"
      },
      {
        "name": "220",
        "series": "2 Series"
      },
      {
        "name": "220 Active Tourer",
        "series": "2 Series"
      },
      {
        "name": "220 Gran Tourer",
        "series": "2 Series"
      },
      {
        "name": "225",
        "series": "2 Series"
      },
      {
        "name": "225 Active Tourer",
        "series": "2 Series"
      },
      {
        "name": "228",
        "series": "2 Series"
      },
      {
        "name": "230",
        "series": "2 Series"
      },
      {
        "name": "315",
        "series": "3 Series"
      },
      {
        "name": "316",
        "series": "3 Series"
      },
      {
        "name": "318",
        "series": "3 Series"
      },
      {
        "name": "318 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "320",
        "series": "3 Series"
      },
      {
        "name": "320 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "323",
        "series": "3 Series"
      },
      {
        "name": "324",
        "series": "3 Series"
      },
      {
        "name": "325",
        "series": "3 Series"
      },
      {
        "name": "325 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "328",
        "series": "3 Series"
      },
      {
        "name": "328 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "330",
        "series": "3 Series"
      },
      {
        "name": "330 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "335",
        "series": "3 Series"
      },
      {
        "name": "335 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "340",
        "series": "3 Series"
      },
      {
        "name": "340 Gran Turismo",
        "series": "3 Series"
      },
      {
        "name": "418",
        "series": "4 Series"
      },
      {
        "name": "418 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "420",
        "series": "4 Series"
      },
      {
        "name": "420 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "425",
        "series": "4 Series"
      },
      {
        "name": "425 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "428",
        "series": "4 Series"
      },
      {
        "name": "428 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "430",
        "series": "4 Series"
      },
      {
        "name": "430 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "435",
        "series": "4 Series"
      },
      {
        "name": "435 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "440",
        "series": "4 Series"
      },
      {
        "name": "440 Gran Coupé",
        "series": "4 Series"
      },
      {
        "name": "518",
        "series": "5 Series"
      },
      {
        "name": "520",
        "series": "5 Series"
      },
      {
        "name": "520 Gran Turismo",
        "series": "5 Series"
      },
      {
        "name": "523",
        "series": "5 Series"
      },
      {
        "name": "524",
        "series": "5 Series"
      },
      {
        "name": "525",
        "series": "5 Series"
      },
      {
        "name": "528",
        "series": "5 Series"
      },
      {
        "name": "530",
        "series": "5 Series"
      },
      {
        "name": "530 Gran Turismo",
        "series": "5 Series"
      },
      {
        "name": "535",
        "series": "5 Series"
      },
      {
        "name": "535 Gran Turismo",
        "series": "5 Series"
      },
      {
        "name": "540",
        "series": "5 Series"
      },
      {
        "name": "545",
        "series": "5 Series"
      },
      {
        "name": "550",
        "series": "5 Series"
      },
      {
        "name": "550 Gran Turismo",
        "series": "5 Series"
      },
      {
        "name": "620 Gran Turismo",
        "series": "6 Series"
      },
      {
        "name": "628",
        "series": "6 Series"
      },
      {
        "name": "630",
        "series": "6 Series"
      },
      {
        "name": "630 Gran Turismo",
        "series": "6 Series"
      },
      {
        "name": "633",
        "series": "6 Series"
      },
      {
        "name": "635",
        "series": "6 Series"
      },
      {
        "name": "640",
        "series": "6 Series"
      },
      {
        "name": "640 Gran Coupé",
        "series": "6 Series"
      },
      {
        "name": "640 Gran Turismo",
        "series": "6 Series"
      },
      {
        "name": "645",
        "series": "6 Series"
      },
      {
        "name": "650",
        "series": "6 Series"
      },
      {
        "name": "650 Gran Coupé",
        "series": "6 Series"
      },
      {
        "name": "725",
        "series": "7 Series"
      },
      {
        "name": "728",
        "series": "7 Series"
      },
      {
        "name": "730",
        "series": "7 Series"
      },
      {
        "name": "732",
        "series": "7 Series"
      },
      {
        "name": "735",
        "series": "7 Series"
      },
      {
        "name": "740",
        "series": "7 Series"
      },
      {
        "name": "745",
        "series": "7 Series"
      },
      {
        "name": "750",
        "series": "7 Series"
      },
      {
        "name": "760",
        "series": "7 Series"
      },
      {
        "name": "840"
      },
      {
        "name": "850"
      },
      {
        "name": "ActiveHybrid 3",
        "series": "3 Series"
      },
      {
        "name": "ActiveHybrid 5",
        "series": "5 Series"
      },
      {
        "name": "ActiveHybrid 7",
        "series": "7 Series"
      },
      {
        "name": "ActiveHybrid X6",
        "series": "X Series"
      },
      {
        "name": "i3"
      },
      {
        "name": "i8"
      },
      {
        "name": "M135",
        "series": "M Models"
      },
      {
        "name": "M140i",
        "series": "M Models"
      },
      {
        "name": "M2",
        "series": "M Models"
      },
      {
        "name": "M235",
        "series": "M Models"
      },
      {
        "name": "M240i",
        "series": "M Models"
      },
      {
        "name": "M3",
        "series": "M Models"
      },
      {
        "name": "M340i",
        "series": "M Models"
      },
      {
        "name": "M4",
        "series": "M Models"
      },
      {
        "name": "M5",
        "series": "M Models"
      },
      {
        "name": "M550",
        "series": "M Models"
      },
      {
        "name": "M6",
        "series": "M Models"
      },
      {
        "name": "M760",
        "series": "M Models"
      },
      {
        "name": "M850",
        "series": "M Models"
      },
      {
        "name": "X1",
        "series": "X Series"
      },
      {
        "name": "X2",
        "series": "X Series"
      },
      {
        "name": "X3",
        "series": "X Series"
      },
      {
        "name": "X3 M",
        "series": "X Series"
      },
      {
        "name": "X3 M40",
        "series": "X Series"
      },
      {
        "name": "X4",
        "series": "X Series"
      },
      {
        "name": "X4 M",
        "series": "X Series"
      },
      {
        "name": "X4 M40",
        "series": "X Series"
      },
      {
        "name": "X5",
        "series": "X Series"
      },
      {
        "name": "X5 M",
        "series": "X Series"
      },
      {
        "name": "X5 M50",
        "series": "X Series"
      },
      {
        "name": "X6",
        "series": "X Series"
      },
      {
        "name": "X6 M",
        "series": "X Series"
      },
      {
        "name": "X6 M50",
        "series": "X Series"
      },
      {
        "name": "X7",
        "series": "X Series"
      },
      {
        "name": "Z1",
        "series": "Z Series"
      },
      {
        "name": "Z3",
        "series": "Z Series"
      },
      {
        "name": "Z3 M",
        "series": "Z Series"
      },
      {
        "name": "Z4",
        "series": "Z Series"
      },
      {
        "name": "Z4 M",
        "series": "Z Series"
      },
      {
        "name": "Z8",
        "series": "Z Series"
      }
    ]
  },
  {
    "name": "Borgward",
    "models": []
  },
  {
    "name": "Brilliance",
    "models": [
      {
        "name": "BC3"
      },
      {
        "name": "BS2"
      },
      {
        "name": "BS4"
      },
      {
        "name": "BS6"
      }
    ]
  },
  {
    "name": "Bugatti",
    "models": [
      {
        "name": "Chiron"
      },
      {
        "name": "EB 110"
      },
      {
        "name": "Veyron"
      }
    ]
  },
  {
    "name": "Buick",
    "models": [
      {
        "name": "Century"
      },
      {
        "name": "Electra"
      },
      {
        "name": "Enclave"
      },
      {
        "name": "La Crosse"
      },
      {
        "name": "Le Sabre"
      },
      {
        "name": "Park Avenue"
      },
      {
        "name": "Regal"
      },
      {
        "name": "Riviera"
      },
      {
        "name": "Roadmaster"
      },
      {
        "name": "Skylark"
      }
    ]
  },
  {
    "name": "Cadillac",
    "models": [
      {
        "name": "Allante"
      },
      {
        "name": "ATS"
      },
      {
        "name": "BLS"
      },
      {
        "name": "CT6"
      },
      {
        "name": "CTS"
      },
      {
        "name": "Deville"
      },
      {
        "name": "Eldorado"
      },
      {
        "name": "Escalade"
      },
      {
        "name": "Fleetwood"
      },
      {
        "name": "Seville"
      },
      {
        "name": "SRX"
      },
      {
        "name": "STS"
      },
      {
        "name": "XLR"
      },
      {
        "name": "XT5"
      }
    ]
  },
  {
    "name": "Casalini",
    "models": []
  },
  {
    "name": "Caterham",
    "models": []
  },
  {
    "name": "Changan",
    "models": [
      {
        "name": "Alsvin"
      },
      {
        "name": "CS35 Plus"
      },
      {
        "name": "CS55 Plus"
      },
      {
        "name": "CS75 FL"
      },
      {
        "name": "CS75 Plus"
      },
      {
        "name": "CS95"
      },
      {
        "name": "Hunter Plus"
      },
      {
        "name": "Lamore"
      },
      {
        "name": "UNI-K"
      },
      {
        "name": "UNI-T"
      },
      {
        "name": "UNI-V"
      }
    ]
  },
  {
    "name": "Chatenet",
    "models": []
  },
  {
    "name": "Chery",
    "models": [
      {
        "name": "Arrizo 8"
      },
      {
        "name": "Tiggo 2"
      },
      {
        "name": "Tiggo 4"
      },
      {
        "name": "Tiggo 4 Pro"
      },
      {
        "name": "Tiggo 7 Pro"
      },
      {
        "name": "Tiggo 7 Pro Max"
      },
      {
        "name": "Tiggo 8"
      },
      {
        "name": "Tiggo 8 Pro"
      },
      {
        "name": "Tiggo 8 Pro Max"
      }
    ]
  },
  {
    "name": "Chevrolet",
    "models": [
      {
        "name": "2500"
      },
      {
        "name": "Alero"
      },
      {
        "name": "Astro"
      },
      {
        "name": "Avalanche"
      },
      {
        "name": "Aveo"
      },
      {
        "name": "Beretta"
      },
      {
        "name": "Blazer"
      },
      {
        "name": "C1500"
      },
      {
        "name": "Camaro"
      },
      {
        "name": "Caprice"
      },
      {
        "name": "Captiva"
      },
      {
        "name": "Cavalier"
      },
      {
        "name": "Chevelle"
      },
      {
        "name": "Chevy Van"
      },
      {
        "name": "Citation"
      },
      {
        "name": "Colorado"
      },
      {
        "name": "Corsica"
      },
      {
        "name": "Cruze"
      },
      {
        "name": "El Camino"
      },
      {
        "name": "Epica"
      },
      {
        "name": "Evanda"
      },
      {
        "name": "Express"
      },
      {
        "name": "G"
      },
      {
        "name": "HHR"
      },
      {
        "name": "Impala"
      },
      {
        "name": "K1500"
      },
      {
        "name": "K30"
      },
      {
        "name": "Kalos"
      },
      {
        "name": "Lacetti"
      },
      {
        "name": "Lumina"
      },
      {
        "name": "Malibu"
      },
      {
        "name": "Matiz"
      },
      {
        "name": "Niva"
      },
      {
        "name": "Nubira"
      },
      {
        "name": "Orlando"
      },
      {
        "name": "Rezzo"
      },
      {
        "name": "S-10"
      },
      {
        "name": "Silverado"
      },
      {
        "name": "Spark"
      },
      {
        "name": "SSR"
      },
      {
        "name": "Suburban"
      },
      {
        "name": "Tahoe"
      },
      {
        "name": "Trailblazer"
      },
      {
        "name": "Trans Sport"
      },
      {
        "name": "Traverse"
      },
      {
        "name": "Trax"
      },
      {
        "name": "Venture"
      },
      {
        "name": "Volt"
      }
    ]
  },
  {
    "name": "Chrysler",
    "models": [
      {
        "name": "200"
      },
      {
        "name": "300 M"
      },
      {
        "name": "300C"
      },
      {
        "name": "Aspen"
      },
      {
        "name": "Crossfire"
      },
      {
        "name": "Daytona"
      },
      {
        "name": "ES"
      },
      {
        "name": "Grand Voyager"
      },
      {
        "name": "GS"
      },
      {
        "name": "GTS"
      },
      {
        "name": "Imperial"
      },
      {
        "name": "Le Baron"
      },
      {
        "name": "Neon"
      },
      {
        "name": "New Yorker"
      },
      {
        "name": "Pacifica"
      },
      {
        "name": "PT Cruiser"
      },
      {
        "name": "Saratoga"
      },
      {
        "name": "Sebring"
      },
      {
        "name": "Stratus"
      },
      {
        "name": "Valiant"
      },
      {
        "name": "Viper"
      },
      {
        "name": "Vision"
      },
      {
        "name": "Voyager"
      }
    ]
  },
  {
    "name": "Citroën",
    "models": [
      {
        "name": "2 CV"
      },
      {
        "name": "AX"
      },
      {
        "name": "Berlingo"
      },
      {
        "name": "BX"
      },
      {
        "name": "C-Crosser"
      },
      {
        "name": "C-Elysée"
      },
      {
        "name": "C-Zero"
      },
      {
        "name": "C1"
      },
      {
        "name": "C2"
      },
      {
        "name": "C3"
      },
      {
        "name": "C3 Aircross"
      },
      {
        "name": "C3 Picasso"
      },
      {
        "name": "C4"
      },
      {
        "name": "C4 Aircross"
      },
      {
        "name": "C4 Cactus"
      },
      {
        "name": "C4 Picasso"
      },
      {
        "name": "C4 SpaceTourer"
      },
      {
        "name": "C5"
      },
      {
        "name": "C5 Aircross"
      },
      {
        "name": "C6"
      },
      {
        "name": "C8"
      },
      {
        "name": "CX"
      },
      {
        "name": "DS"
      },
      {
        "name": "DS3"
      },
      {
        "name": "DS4"
      },
      {
        "name": "DS4 Crossback"
      },
      {
        "name": "DS5"
      },
      {
        "name": "E-MEHARI"
      },
      {
        "name": "Evasion"
      },
      {
        "name": "Grand C4 Picasso / SpaceTourer"
      },
      {
        "name": "GSA"
      },
      {
        "name": "Jumper"
      },
      {
        "name": "Jumpy"
      },
      {
        "name": "Nemo"
      },
      {
        "name": "SAXO"
      },
      {
        "name": "SM"
      },
      {
        "name": "SpaceTourer"
      },
      {
        "name": "Visa"
      },
      {
        "name": "Xantia"
      },
      {
        "name": "XM"
      },
      {
        "name": "Xsara"
      },
      {
        "name": "Xsara Picasso"
      },
      {
        "name": "ZX"
      }
    ]
  },
  {
    "name": "Cobra",
    "models": []
  },
  {
    "name": "Corvette",
    "models": [
      {
        "name": "C1"
      },
      {
        "name": "C2"
      },
      {
        "name": "C3"
      },
      {
        "name": "C4"
      },
      {
        "name": "C5"
      },
      {
        "name": "C6"
      },
      {
        "name": "C7"
      },
      {
        "name": "C8"
      },
      {
        "name": "Z06"
      },
      {
        "name": "ZR 1"
      }
    ]
  },
  {
    "name": "Cupra",
    "models": [
      {
        "name": "Arona"
      },
      {
        "name": "Ateca"
      },
      {
        "name": "Ibiza"
      }
    ]
  },
  {
    "name": "Dacia",
    "models": [
      {
        "name": "Dokker"
      },
      {
        "name": "Duster"
      },
      {
        "name": "Lodgy"
      },
      {
        "name": "Logan"
      },
      {
        "name": "Logan Pick-Up"
      },
      {
        "name": "Pick Up"
      },
      {
        "name": "Sandero"
      }
    ]
  },
  {
    "name": "Daewoo",
    "models": [
      {
        "name": "Espero"
      },
      {
        "name": "Evanda"
      },
      {
        "name": "Kalos"
      },
      {
        "name": "Korando"
      },
      {
        "name": "Lacetti"
      },
      {
        "name": "Lanos"
      },
      {
        "name": "Leganza"
      },
      {
        "name": "Matiz"
      },
      {
        "name": "Musso"
      },
      {
        "name": "Nexia"
      },
      {
        "name": "Nubira"
      },
      {
        "name": "Rezzo"
      },
      {
        "name": "Tacuma"
      }
    ]
  },
  {
    "name": "Daihatsu",
    "models": [
      {
        "name": "Applause"
      },
      {
        "name": "Charade"
      },
      {
        "name": "Charmant"
      },
      {
        "name": "Copen"
      },
      {
        "name": "Cuore"
      },
      {
        "name": "Feroza/Sportrak"
      },
      {
        "name": "Freeclimber"
      },
      {
        "name": "Gran Move"
      },
      {
        "name": "Hijet"
      },
      {
        "name": "MATERIA"
      },
      {
        "name": "Move"
      },
      {
        "name": "Rocky/Fourtrak"
      },
      {
        "name": "Sirion"
      },
      {
        "name": "Terios"
      },
      {
        "name": "TREVIS"
      },
      {
        "name": "YRV"
      }
    ]
  },
  {
    "name": "DeTomaso",
    "models": [
      {
        "name": "Guarà"
      },
      {
        "name": "Pantera"
      }
    ]
  },
  {
    "name": "Dodge",
    "models": [
      {
        "name": "Avenger"
      },
      {
        "name": "Caliber"
      },
      {
        "name": "Challenger"
      },
      {
        "name": "Charger"
      },
      {
        "name": "Dakota"
      },
      {
        "name": "Dart"
      },
      {
        "name": "Demon"
      },
      {
        "name": "Durango"
      },
      {
        "name": "Grand Caravan"
      },
      {
        "name": "Hornet"
      },
      {
        "name": "Journey"
      },
      {
        "name": "Magnum"
      },
      {
        "name": "Neon"
      },
      {
        "name": "Nitro"
      },
      {
        "name": "RAM"
      },
      {
        "name": "Stealth"
      },
      {
        "name": "Viper"
      }
    ]
  },
  {
    "name": "Donkervoort",
    "models": [
      {
        "name": "D8"
      },
      {
        "name": "S7"
      },
      {
        "name": "S8"
      }
    ]
  },
  {
    "name": "DS Automobiles",
    "models": [
      {
        "name": "DS3"
      },
      {
        "name": "DS3 Crossback"
      },
      {
        "name": "DS4"
      },
      {
        "name": "DS4 Crossback"
      },
      {
        "name": "DS5"
      },
      {
        "name": "DS7 Crossback"
      }
    ]
  },
  {
    "name": "Exeed",
    "models": [
      {
        "name": "LX"
      },
      {
        "name": "RX"
      },
      {
        "name": "TXL"
      },
      {
        "name": "VX"
      }
    ]
  },
  {
    "name": "FAW",
    "models": [
      {
        "name": "Bestune B70"
      },
      {
        "name": "Bestune T55"
      },
      {
        "name": "Bestune T77"
      },
      {
        "name": "Bestune T90"
      },
      {
        "name": "Bestune T99"
      }
    ]
  },
  {
    "name": "Ferrari",
    "models": [
      {
        "name": "208"
      },
      {
        "name": "246"
      },
      {
        "name": "250"
      },
      {
        "name": "275"
      },
      {
        "name": "288"
      },
      {
        "name": "308"
      },
      {
        "name": "328"
      },
      {
        "name": "330"
      },
      {
        "name": "348"
      },
      {
        "name": "360"
      },
      {
        "name": "365"
      },
      {
        "name": "400"
      },
      {
        "name": "412"
      },
      {
        "name": "456"
      },
      {
        "name": "458"
      },
      {
        "name": "488 GTB"
      },
      {
        "name": "488 Pista"
      },
      {
        "name": "488 Spider"
      },
      {
        "name": "512"
      },
      {
        "name": "550"
      },
      {
        "name": "575"
      },
      {
        "name": "599 GTB"
      },
      {
        "name": "599 GTO"
      },
      {
        "name": "599 SA Aperta"
      },
      {
        "name": "612"
      },
      {
        "name": "750"
      },
      {
        "name": "812"
      },
      {
        "name": "California"
      },
      {
        "name": "Daytona"
      },
      {
        "name": "Dino GT4"
      },
      {
        "name": "Enzo Ferrari"
      },
      {
        "name": "F12"
      },
      {
        "name": "F355"
      },
      {
        "name": "F40"
      },
      {
        "name": "F430"
      },
      {
        "name": "F50"
      },
      {
        "name": "FF"
      },
      {
        "name": "GTC4Lusso"
      },
      {
        "name": "LaFerrari"
      },
      {
        "name": "Mondial"
      },
      {
        "name": "Portofino"
      },
      {
        "name": "Superamerica"
      },
      {
        "name": "Testarossa"
      }
    ]
  },
  {
    "name": "Fiat",
    "models": [
      {
        "name": "124"
      },
      {
        "name": "124 Spider"
      },
      {
        "name": "126"
      },
      {
        "name": "127"
      },
      {
        "name": "130"
      },
      {
        "name": "131"
      },
      {
        "name": "500"
      },
      {
        "name": "500C"
      },
      {
        "name": "500L"
      },
      {
        "name": "500L Cross"
      },
      {
        "name": "500L Living"
      },
      {
        "name": "500L Trekking"
      },
      {
        "name": "500L Urban"
      },
      {
        "name": "500L Wagon"
      },
      {
        "name": "500S"
      },
      {
        "name": "500X"
      },
      {
        "name": "Albea"
      },
      {
        "name": "Barchetta"
      },
      {
        "name": "Brava"
      },
      {
        "name": "Bravo"
      },
      {
        "name": "Cinquecento"
      },
      {
        "name": "Coupe"
      },
      {
        "name": "Croma"
      },
      {
        "name": "Dino"
      },
      {
        "name": "Doblo"
      },
      {
        "name": "Ducato"
      },
      {
        "name": "Fiorino"
      },
      {
        "name": "Freemont"
      },
      {
        "name": "Fullback"
      },
      {
        "name": "Grande Punto"
      },
      {
        "name": "Idea"
      },
      {
        "name": "Linea"
      },
      {
        "name": "Marea"
      },
      {
        "name": "Marengo"
      },
      {
        "name": "Multipla"
      },
      {
        "name": "New Panda"
      },
      {
        "name": "Palio"
      },
      {
        "name": "Panda"
      },
      {
        "name": "Punto"
      },
      {
        "name": "Punto Evo"
      },
      {
        "name": "Qubo"
      },
      {
        "name": "Regata"
      },
      {
        "name": "Ritmo"
      },
      {
        "name": "Scudo"
      },
      {
        "name": "Sedici"
      },
      {
        "name": "Seicento"
      },
      {
        "name": "Siena"
      },
      {
        "name": "Spider Europa"
      },
      {
        "name": "Stilo"
      },
      {
        "name": "Strada"
      },
      {
        "name": "Talento"
      },
      {
        "name": "Tempra"
      },
      {
        "name": "Tipo"
      },
      {
        "name": "Ulysse"
      },
      {
        "name": "Uno"
      },
      {
        "name": "X 1/9"
      }
    ]
  },
  {
    "name": "Fisker",
    "models": [
      {
        "name": "Karma"
      }
    ]
  },
  {
    "name": "Ford",
    "models": [
      {
        "name": "Aerostar"
      },
      {
        "name": "B-Max"
      },
      {
        "name": "Bronco"
      },
      {
        "name": "C-Max"
      },
      {
        "name": "Capri"
      },
      {
        "name": "Cougar"
      },
      {
        "name": "Courier"
      },
      {
        "name": "Crown"
      },
      {
        "name": "Econoline"
      },
      {
        "name": "Econovan"
      },
      {
        "name": "EcoSport"
      },
      {
        "name": "Edge"
      },
      {
        "name": "Escape"
      },
      {
        "name": "Escort"
      },
      {
        "name": "Excursion"
      },
      {
        "name": "Expedition"
      },
      {
        "name": "Explorer"
      },
      {
        "name": "Express"
      },
      {
        "name": "F 100"
      },
      {
        "name": "F 150"
      },
      {
        "name": "F 250"
      },
      {
        "name": "F 350"
      },
      {
        "name": "Fairlane"
      },
      {
        "name": "Falcon"
      },
      {
        "name": "Fiesta"
      },
      {
        "name": "Flex"
      },
      {
        "name": "Focus"
      },
      {
        "name": "Fusion"
      },
      {
        "name": "Galaxy"
      },
      {
        "name": "Granada"
      },
      {
        "name": "Grand C-Max"
      },
      {
        "name": "Grand Tourneo"
      },
      {
        "name": "GT"
      },
      {
        "name": "Ka/Ka+"
      },
      {
        "name": "Kuga"
      },
      {
        "name": "Maverick"
      },
      {
        "name": "Mercury"
      },
      {
        "name": "Mondeo"
      },
      {
        "name": "Mustang"
      },
      {
        "name": "Orion"
      },
      {
        "name": "Probe"
      },
      {
        "name": "Puma"
      },
      {
        "name": "Ranger"
      },
      {
        "name": "Raptor"
      },
      {
        "name": "S-Max"
      },
      {
        "name": "Scorpio"
      },
      {
        "name": "Sierra"
      },
      {
        "name": "Sportka"
      },
      {
        "name": "Streetka"
      },
      {
        "name": "Taunus"
      },
      {
        "name": "Taurus"
      },
      {
        "name": "Thunderbird"
      },
      {
        "name": "Tourneo",
        "series": "Tourneo"
      },
      {
        "name": "Tourneo Connect",
        "series": "Tourneo"
      },
      {
        "name": "Tourneo Courier",
        "series": "Tourneo"
      },
      {
        "name": "Tourneo Custom",
        "series": "Tourneo"
      },
      {
        "name": "Transit",
        "series": "Transit"
      },
      {
        "name": "Transit Connect",
        "series": "Transit"
      },
      {
        "name": "Transit Courier",
        "series": "Transit"
      },
      {
        "name": "Transit Custom",
        "series": "Transit"
      },
      {
        "name": "Windstar"
      }
    ]
  },
  {
    "name": "GAC Gonow",
    "models": []
  },
  {
    "name": "GAZ",
    "models": [
      {
        "name": "Gazelle"
      },
      {
        "name": "Gazelle Next"
      },
      {
        "name": "Sobol"
      },
      {
        "name": "Sobol NN"
      }
    ]
  },
  {
    "name": "Geely",
    "models": [
      {
        "name": "Atlas"
      },
      {
        "name": "Atlas Pro"
      },
      {
        "name": "Coolray"
      },
      {
        "name": "Emgrand"
      },
      {
        "name": "Monjaro"
      },
      {
        "name": "Okavango"
      },
      {
        "name": "Preface"
      },
      {
        "name": "Tugella"
      }
    ]
  },
  {
    "name": "Gemballa",
    "models": []
  },
  {
    "name": "Genesis",
    "models": [
      {
        "name": "G70"
      },
      {
        "name": "G80"
      },
      {
        "name": "G90"
      },
      {
        "name": "GV60"
      },
      {
        "name": "GV70"
      },
      {
        "name": "GV80"
      }
    ]
  },
  {
    "name": "GMC",
    "models": [
      {
        "name": "Acadia"
      },
      {
        "name": "Envoy"
      },
      {
        "name": "Safari"
      },
      {
        "name": "Savana"
      },
      {
        "name": "Sierra"
      },
      {
        "name": "Sonoma"
      },
      {
        "name": "Syclone"
      },
      {
        "name": "Terrain"
      },
      {
        "name": "Typhoon"
      },
      {
        "name": "Vandura"
      },
      {
        "name": "Yukon"
      }
    ]
  },
  {
    "name": "Grecav",
    "models": [
      {
        "name": "Sonique"
      }
    ]
  },
  {
    "name": "Hamann",
    "models": []
  },
  {
    "name": "Haval",
    "models": [
      {
        "name": "Dargo"
      },
      {
        "name": "F7"
      },
      {
        "name": "F7x"
      },
      {
        "name": "H3"
      },
      {
        "name": "H5"
      },
      {
        "name": "H6"
      },
      {
        "name": "H9"
      },
      {
        "name": "Jolion"
      },
      {
        "name": "M6"
      }
    ]
  },
  {
    "name": "Holden",
    "models": []
  },
  {
    "name": "Honda",
    "models": [
      {
        "name": "Accord"
      },
      {
        "name": "Aerodeck"
      },
      {
        "name": "City"
      },
      {
        "name": "Civic"
      },
      {
        "name": "Clarity"
      },
      {
        "name": "Concerto"
      },
      {
        "name": "CR-V"
      },
      {
        "name": "CR-Z"
      },
      {
        "name": "CRX"
      },
      {
        "name": "e"
      },
      {
        "name": "Element"
      },
      {
        "name": "FR-V"
      },
      {
        "name": "HR-V"
      },
      {
        "name": "Insight"
      },
      {
        "name": "Integra"
      },
      {
        "name": "Jazz"
      },
      {
        "name": "Legend"
      },
      {
        "name": "Logo"
      },
      {
        "name": "NSX"
      },
      {
        "name": "Odyssey"
      },
      {
        "name": "Pilot"
      },
      {
        "name": "Prelude"
      },
      {
        "name": "Ridgeline"
      },
      {
        "name": "S2000"
      },
      {
        "name": "Shuttle"
      },
      {
        "name": "Stream"
      }
    ]
  },
  {
    "name": "Hongqi",
    "models": [
      {
        "name": "E-HS9"
      },
      {
        "name": "H5"
      },
      {
        "name": "H9"
      },
      {
        "name": "HS5"
      },
      {
        "name": "HS7"
      }
    ]
  },
  {
    "name": "Hummer",
    "models": [
      {
        "name": "H1"
      },
      {
        "name": "H2"
      },
      {
        "name": "H3"
      }
    ]
  },
  {
    "name": "Hyundai",
    "models": [
      {
        "name": "Accent"
      },
      {
        "name": "Atos"
      },
      {
        "name": "Azera"
      },
      {
        "name": "Coupe"
      },
      {
        "name": "Elantra"
      },
      {
        "name": "Excel"
      },
      {
        "name": "Galloper"
      },
      {
        "name": "Genesis"
      },
      {
        "name": "Getz"
      },
      {
        "name": "Grand Santa Fe"
      },
      {
        "name": "Grandeur"
      },
      {
        "name": "H 100"
      },
      {
        "name": "H 200"
      },
      {
        "name": "H-1"
      },
      {
        "name": "H-1 Starex"
      },
      {
        "name": "H350"
      },
      {
        "name": "i10"
      },
      {
        "name": "i20"
      },
      {
        "name": "i30"
      },
      {
        "name": "i40"
      },
      {
        "name": "i50"
      },
      {
        "name": "IONIQ"
      },
      {
        "name": "ix20"
      },
      {
        "name": "ix35"
      },
      {
        "name": "ix55"
      },
      {
        "name": "Kona"
      },
      {
        "name": "Lantra"
      },
      {
        "name": "Matrix"
      },
      {
        "name": "Nexo"
      },
      {
        "name": "Pony"
      },
      {
        "name": "S-Coupe"
      },
      {
        "name": "Santa Fe"
      },
      {
        "name": "Santamo"
      },
      {
        "name": "Sonata"
      },
      {
        "name": "Terracan"
      },
      {
        "name": "Trajet"
      },
      {
        "name": "Tucson"
      },
      {
        "name": "Veloster"
      },
      {
        "name": "Veracruz"
      },
      {
        "name": "XG 30"
      },
      {
        "name": "XG 350"
      }
    ]
  },
  {
    "name": "Infiniti",
    "models": [
      {
        "name": "EX30"
      },
      {
        "name": "EX35"
      },
      {
        "name": "EX37"
      },
      {
        "name": "FX"
      },
      {
        "name": "G35"
      },
      {
        "name": "G37"
      },
      {
        "name": "M30"
      },
      {
        "name": "M35"
      },
      {
        "name": "M37"
      },
      {
        "name": "Q30"
      },
      {
        "name": "Q45"
      },
      {
        "name": "Q50"
      },
      {
        "name": "Q60"
      },
      {
        "name": "Q70"
      },
      {
        "name": "QX30"
      },
      {
        "name": "QX50"
      },
      {
        "name": "QX56"
      },
      {
        "name": "QX70"
      }
    ]
  },
  {
    "name": "Isuzu",
    "models": [
      {
        "name": "Campo"
      },
      {
        "name": "D-Max"
      },
      {
        "name": "Gemini"
      },
      {
        "name": "Midi"
      },
      {
        "name": "PICK UP"
      },
      {
        "name": "Trooper"
      }
    ]
  },
  {
    "name": "Iveco",
    "models": [
      {
        "name": "Massif"
      }
    ]
  },
  {
    "name": "Jaguar",
    "models": [
      {
        "name": "Daimler"
      },
      {
        "name": "E-Pace"
      },
      {
        "name": "E-Type"
      },
      {
        "name": "F-Pace"
      },
      {
        "name": "F-Type"
      },
      {
        "name": "I-Pace"
      },
      {
        "name": "MK II"
      },
      {
        "name": "S-Type"
      },
      {
        "name": "X-Type"
      },
      {
        "name": "XE"
      },
      {
        "name": "XF"
      },
      {
        "name": "XJ"
      },
      {
        "name": "XJ12"
      },
      {
        "name": "XJ40"
      },
      {
        "name": "XJ6"
      },
      {
        "name": "XJ8"
      },
      {
        "name": "XJR"
      },
      {
        "name": "XJS"
      },
      {
        "name": "XJSC"
      },
      {
        "name": "XK"
      },
      {
        "name": "XK8"
      },
      {
        "name": "XKR"
      }
    ]
  },
  {
    "name": "Jeep",
    "models": [
      {
        "name": "Cherokee"
      },
      {
        "name": "CJ"
      },
      {
        "name": "Comanche"
      },
      {
        "name": "Commander"
      },
      {
        "name": "Compass"
      },
      {
        "name": "Grand Cherokee"
      },
      {
        "name": "Patriot"
      },
      {
        "name": "Renegade"
      },
      {
        "name": "Wagoneer"
      },
      {
        "name": "Willys"
      },
      {
        "name": "Wrangler"
      }
    ]
  },
  {
    "name": "Jetour",
    "models": [
      {
        "name": "Dashing"
      },
      {
        "name": "T2"
      },
      {
        "name": "X50"
      },
      {
        "name": "X70"
      },
      {
        "name": "X90"
      }
    ]
  },
  {
    "name": "Kia",
    "models": [
      {
        "name": "Besta"
      },
      {
        "name": "Borrego"
      },
      {
        "name": "Carens"
      },
      {
        "name": "Carnival"
      },
      {
        "name": "cee'd / Ceed"
      },
      {
        "name": "cee'd Sportswagon"
      },
      {
        "name": "Cerato"
      },
      {
        "name": "Clarus"
      },
      {
        "name": "Elan"
      },
      {
        "name": "Joice"
      },
      {
        "name": "K2500"
      },
      {
        "name": "K2700"
      },
      {
        "name": "Leo"
      },
      {
        "name": "Magentis"
      },
      {
        "name": "Mentor"
      },
      {
        "name": "Mini"
      },
      {
        "name": "Niro"
      },
      {
        "name": "Opirus"
      },
      {
        "name": "Optima"
      },
      {
        "name": "Picanto"
      },
      {
        "name": "Pregio"
      },
      {
        "name": "Pride"
      },
      {
        "name": "pro_cee'd / ProCeed"
      },
      {
        "name": "Retona"
      },
      {
        "name": "Rio"
      },
      {
        "name": "Roadster"
      },
      {
        "name": "Rocsta"
      },
      {
        "name": "Sephia"
      },
      {
        "name": "Shuma"
      },
      {
        "name": "Sorento"
      },
      {
        "name": "Soul"
      },
      {
        "name": "Sportage"
      },
      {
        "name": "Stinger"
      },
      {
        "name": "Stonic"
      },
      {
        "name": "Venga"
      },
      {
        "name": "XCeed"
      }
    ]
  },
  {
    "name": "Koenigsegg",
    "models": [
      {
        "name": "Agera"
      },
      {
        "name": "CCR"
      },
      {
        "name": "CCXR"
      }
    ]
  },
  {
    "name": "KTM",
    "models": [
      {
        "name": "X-BOW"
      }
    ]
  },
  {
    "name": "Lada",
    "models": [
      {
        "name": "110"
      },
      {
        "name": "111"
      },
      {
        "name": "112"
      },
      {
        "name": "1200"
      },
      {
        "name": "2107"
      },
      {
        "name": "2110"
      },
      {
        "name": "2111"
      },
      {
        "name": "2112"
      },
      {
        "name": "Aleko"
      },
      {
        "name": "Forma"
      },
      {
        "name": "Granta"
      },
      {
        "name": "Kalina"
      },
      {
        "name": "Niva"
      },
      {
        "name": "Nova"
      },
      {
        "name": "Priora"
      },
      {
        "name": "Samara"
      },
      {
        "name": "Taiga"
      },
      {
        "name": "Urban"
      },
      {
        "name": "Vesta"
      },
      {
        "name": "X-Ray"
      }
    ]
  },
  {
    "name": "Lamborghini",
    "models": [
      {
        "name": "Aventador"
      },
      {
        "name": "Countach"
      },
      {
        "name": "Diablo"
      },
      {
        "name": "Espada"
      },
      {
        "name": "Gallardo"
      },
      {
        "name": "Huracán"
      },
      {
        "name": "Jalpa"
      },
      {
        "name": "LM"
      },
      {
        "name": "Miura"
      },
      {
        "name": "Murciélago"
      },
      {
        "name": "Urraco"
      },
      {
        "name": "Urus"
      }
    ]
  },
  {
    "name": "Lancia",
    "models": [
      {
        "name": "Beta"
      },
      {
        "name": "Dedra"
      },
      {
        "name": "Delta"
      },
      {
        "name": "Flaminia"
      },
      {
        "name": "Flavia"
      },
      {
        "name": "Fulvia"
      },
      {
        "name": "Gamma"
      },
      {
        "name": "Kappa"
      },
      {
        "name": "Lybra"
      },
      {
        "name": "MUSA"
      },
      {
        "name": "Phedra"
      },
      {
        "name": "Prisma"
      },
      {
        "name": "Stratos"
      },
      {
        "name": "Thema"
      },
      {
        "name": "Thesis"
      },
      {
        "name": "Voyager"
      },
      {
        "name": "Ypsilon"
      },
      {
        "name": "Zeta"
      }
    ]
  },
  {
    "name": "Land Rover",
    "models": [
      {
        "name": "Defender"
      },
      {
        "name": "Discovery"
      },
      {
        "name": "Discovery Sport"
      },
      {
        "name": "Freelander"
      },
      {
        "name": "Range Rover"
      },
      {
        "name": "Range Rover Evoque"
      },
      {
        "name": "Range Rover Sport"
      },
      {
        "name": "Range Rover Velar"
      },
      {
        "name": "Serie I"
      },
      {
        "name": "Serie II"
      },
      {
        "name": "Serie III"
      }
    ]
  },
  {
    "name": "Landwind",
    "models": [
      {
        "name": "CV-9"
      },
      {
        "name": "S"
      },
      {
        "name": "SC2"
      },
      {
        "name": "SC4"
      }
    ]
  },
  {
    "name": "Lexus",
    "models": [
      {
        "name": "CT 200h"
      },
      {
        "name": "ES 300",
        "series": "ES Series"
      },
      {
        "name": "ES 330",
        "series": "ES Series"
      },
      {
        "name": "ES 350",
        "series": "ES Series"
      },
      {
        "name": "GS 250",
        "series": "GS Series"
      },
      {
        "name": "GS 300",
        "series": "GS Series"
      },
      {
        "name": "GS 350",
        "series": "GS Series"
      },
      {
        "name": "GS 430",
        "series": "GS Series"
      },
      {
        "name": "GS 450",
        "series": "GS Series"
      },
      {
        "name": "GS 460",
        "series": "GS Series"
      },
      {
        "name": "GS F",
        "series": "GS Series"
      },
      {
        "name": "GX 470"
      },
      {
        "name": "IS 200",
        "series": "IS Series"
      },
      {
        "name": "IS 220",
        "series": "IS Series"
      },
      {
        "name": "IS 250",
        "series": "IS Series"
      },
      {
        "name": "IS 300",
        "series": "IS Series"
      },
      {
        "name": "IS 350",
        "series": "IS Series"
      },
      {
        "name": "IS-F",
        "series": "IS Series"
      },
      {
        "name": "LC 500"
      },
      {
        "name": "LC 500h"
      },
      {
        "name": "LFA"
      },
      {
        "name": "LS 400",
        "series": "LS Series"
      },
      {
        "name": "LS 430",
        "series": "LS Series"
      },
      {
        "name": "LS 460",
        "series": "LS Series"
      },
      {
        "name": "LS 500",
        "series": "LS Series"
      },
      {
        "name": "LS 600",
        "series": "LS Series"
      },
      {
        "name": "LX 470",
        "series": "LX Series"
      },
      {
        "name": "LX 570",
        "series": "LX Series"
      },
      {
        "name": "NX 200",
        "series": "NX Series"
      },
      {
        "name": "NX 300",
        "series": "NX Series"
      },
      {
        "name": "RC 200",
        "series": "RC Series"
      },
      {
        "name": "RC 300",
        "series": "RC Series"
      },
      {
        "name": "RC 350",
        "series": "RC Series"
      },
      {
        "name": "RC F",
        "series": "RC Series"
      },
      {
        "name": "RX 200",
        "series": "RX Series"
      },
      {
        "name": "RX 300",
        "series": "RX Series"
      },
      {
        "name": "RX 330",
        "series": "RX Series"
      },
      {
        "name": "RX 350",
        "series": "RX Series"
      },
      {
        "name": "RX 400",
        "series": "RX Series"
      },
      {
        "name": "RX 450",
        "series": "RX Series"
      },
      {
        "name": "SC 400"
      },
      {
        "name": "SC 430"
      },
      {
        "name": "UX"
      }
    ]
  },
  {
    "name": "Li Auto",
    "models": [
      {
        "name": "L6"
      },
      {
        "name": "L7"
      },
      {
        "name": "L8"
      },
      {
        "name": "L9"
      },
      {
        "name": "Mega"
      }
    ]
  },
  {
    "name": "Ligier",
    "models": [
      {
        "name": "Ambra"
      },
      {
        "name": "Be Sun"
      },
      {
        "name": "JS 50"
      },
      {
        "name": "JS 50 L"
      },
      {
        "name": "JS RC"
      },
      {
        "name": "Nova"
      },
      {
        "name": "Optima"
      },
      {
        "name": "X - Too"
      }
    ]
  },
  {
    "name": "Lincoln",
    "models": [
      {
        "name": "Aviator"
      },
      {
        "name": "Continental"
      },
      {
        "name": "LS"
      },
      {
        "name": "Mark"
      },
      {
        "name": "Navigator"
      },
      {
        "name": "Town Car"
      }
    ]
  },
  {
    "name": "Lotus",
    "models": [
      {
        "name": "340 R"
      },
      {
        "name": "Cortina"
      },
      {
        "name": "Elan"
      },
      {
        "name": "Elise"
      },
      {
        "name": "Elite"
      },
      {
        "name": "Esprit"
      },
      {
        "name": "Europa"
      },
      {
        "name": "Evora"
      },
      {
        "name": "Excel"
      },
      {
        "name": "Exige"
      },
      {
        "name": "Super Seven"
      }
    ]
  },
  {
    "name": "Mahindra",
    "models": []
  },
  {
    "name": "Maserati",
    "models": [
      {
        "name": "222"
      },
      {
        "name": "224"
      },
      {
        "name": "228"
      },
      {
        "name": "3200"
      },
      {
        "name": "418"
      },
      {
        "name": "420"
      },
      {
        "name": "4200"
      },
      {
        "name": "422"
      },
      {
        "name": "424"
      },
      {
        "name": "430"
      },
      {
        "name": "Biturbo"
      },
      {
        "name": "Ghibli"
      },
      {
        "name": "GranCabrio"
      },
      {
        "name": "Gransport"
      },
      {
        "name": "Granturismo"
      },
      {
        "name": "Indy"
      },
      {
        "name": "Karif"
      },
      {
        "name": "Levante"
      },
      {
        "name": "MC12"
      },
      {
        "name": "Merak"
      },
      {
        "name": "Quattroporte"
      },
      {
        "name": "Shamal"
      },
      {
        "name": "Spyder"
      }
    ]
  },
  {
    "name": "Maybach",
    "models": [
      {
        "name": "57"
      },
      {
        "name": "62"
      },
      {
        "name": "Pullman"
      }
    ]
  },
  {
    "name": "Mazda",
    "models": [
      {
        "name": "121"
      },
      {
        "name": "2"
      },
      {
        "name": "3"
      },
      {
        "name": "323"
      },
      {
        "name": "5"
      },
      {
        "name": "6"
      },
      {
        "name": "626"
      },
      {
        "name": "929"
      },
      {
        "name": "B series"
      },
      {
        "name": "Bongo"
      },
      {
        "name": "BT-50"
      },
      {
        "name": "CX-3"
      },
      {
        "name": "CX-30"
      },
      {
        "name": "CX-5"
      },
      {
        "name": "CX-7"
      },
      {
        "name": "CX-9"
      },
      {
        "name": "Demio"
      },
      {
        "name": "E series"
      },
      {
        "name": "Millenia"
      },
      {
        "name": "MPV"
      },
      {
        "name": "MX-3"
      },
      {
        "name": "MX-5"
      },
      {
        "name": "MX-6"
      },
      {
        "name": "Premacy"
      },
      {
        "name": "Protege"
      },
      {
        "name": "RX-6"
      },
      {
        "name": "RX-7"
      },
      {
        "name": "RX-8"
      },
      {
        "name": "Tribute"
      },
      {
        "name": "Xedos"
      }
    ]
  },
  {
    "name": "McLaren",
    "models": [
      {
        "name": "540C"
      },
      {
        "name": "570GT"
      },
      {
        "name": "570S"
      },
      {
        "name": "650S"
      },
      {
        "name": "650S Coupé"
      },
      {
        "name": "650S Spider"
      },
      {
        "name": "675LT"
      },
      {
        "name": "675LT Spider"
      },
      {
        "name": "720S"
      },
      {
        "name": "GT"
      },
      {
        "name": "MP4-12C"
      },
      {
        "name": "P1"
      }
    ]
  },
  {
    "name": "Mercedes-Benz",
    "models": [
      {
        "name": "190"
      },
      {
        "name": "200"
      },
      {
        "name": "220"
      },
      {
        "name": "230"
      },
      {
        "name": "240"
      },
      {
        "name": "250"
      },
      {
        "name": "260"
      },
      {
        "name": "270"
      },
      {
        "name": "280"
      },
      {
        "name": "290"
      },
      {
        "name": "300"
      },
      {
        "name": "320"
      },
      {
        "name": "350"
      },
      {
        "name": "380"
      },
      {
        "name": "400"
      },
      {
        "name": "416"
      },
      {
        "name": "420"
      },
      {
        "name": "450"
      },
      {
        "name": "500"
      },
      {
        "name": "560"
      },
      {
        "name": "600"
      },
      {
        "name": "A 140",
        "series": "A-Class"
      },
      {
        "name": "A 150",
        "series": "A-Class"
      },
      {
        "name": "A 160",
        "series": "A-Class"
      },
      {
        "name": "A 170",
        "series": "A-Class"
      },
      {
        "name": "A 180",
        "series": "A-Class"
      },
      {
        "name": "A 190",
        "series": "A-Class"
      },
      {
        "name": "A 200",
        "series": "A-Class"
      },
      {
        "name": "A 210",
        "series": "A-Class"
      },
      {
        "name": "A 220",
        "series": "A-Class"
      },
      {
        "name": "A 250",
        "series": "A-Class"
      },
      {
        "name": "A 35 AMG",
        "series": "A-Class"
      },
      {
        "name": "A 45 AMG",
        "series": "A-Class"
      },
      {
        "name": "AMG GT",
        "series": "GT-Class"
      },
      {
        "name": "AMG GT C",
        "series": "GT-Class"
      },
      {
        "name": "AMG GT R",
        "series": "GT-Class"
      },
      {
        "name": "AMG GT S",
        "series": "GT-Class"
      },
      {
        "name": "B 150",
        "series": "B-Class"
      },
      {
        "name": "B 160",
        "series": "B-Class"
      },
      {
        "name": "B 170",
        "series": "B-Class"
      },
      {
        "name": "B 180",
        "series": "B-Class"
      },
      {
        "name": "B 200",
        "series": "B-Class"
      },
      {
        "name": "B 220",
        "series": "B-Class"
      },
      {
        "name": "B 250",
        "series": "B-Class"
      },
      {
        "name": "B Electric Drive",
        "series": "B-Class"
      },
      {
        "name": "C 160",
        "series": "C-Class"
      },
      {
        "name": "C 180",
        "series": "C-Class"
      },
      {
        "name": "C 200",
        "series": "C-Class"
      },
      {
        "name": "C 220",
        "series": "C-Class"
      },
      {
        "name": "C 230",
        "series": "C-Class"
      },
      {
        "name": "C 240",
        "series": "C-Class"
      },
      {
        "name": "C 250",
        "series": "C-Class"
      },
      {
        "name": "C 270",
        "series": "C-Class"
      },
      {
        "name": "C 280",
        "series": "C-Class"
      },
      {
        "name": "C 30 AMG",
        "series": "C-Class"
      },
      {
        "name": "C 300",
        "series": "C-Class"
      },
      {
        "name": "C 32 AMG",
        "series": "C-Class"
      },
      {
        "name": "C 320",
        "series": "C-Class"
      },
      {
        "name": "C 350",
        "series": "C-Class"
      },
      {
        "name": "C 36 AMG",
        "series": "C-Class"
      },
      {
        "name": "C 400",
        "series": "C-Class"
      },
      {
        "name": "C 43 AMG",
        "series": "C-Class"
      },
      {
        "name": "C 450 AMG",
        "series": "C-Class"
      },
      {
        "name": "C 55 AMG",
        "series": "C-Class"
      },
      {
        "name": "C 63 AMG",
        "series": "C-Class"
      },
      {
        "name": "CE 200",
        "series": "CE-Class"
      },
      {
        "name": "CE 220",
        "series": "CE-Class"
      },
      {
        "name": "CE 230",
        "series": "CE-Class"
      },
      {
        "name": "CE 280",
        "series": "CE-Class"
      },
      {
        "name": "CE 300",
        "series": "CE-Class"
      },
      {
        "name": "CE 320",
        "series": "CE-Class"
      },
      {
        "name": "Citan"
      },
      {
        "name": "CL 160",
        "series": "CL-Class"
      },
      {
        "name": "CL 180",
        "series": "CL-Class"
      },
      {
        "name": "CL 200",
        "series": "CL-Class"
      },
      {
        "name": "CL 220",
        "series": "CL-Class"
      },
      {
        "name": "CL 230",
        "series": "CL-Class"
      },
      {
        "name": "CL 320",
        "series": "CL-Class"
      },
      {
        "name": "CL 420",
        "series": "CL-Class"
      },
      {
        "name": "CL 500",
        "series": "CL-Class"
      },
      {
        "name": "CL 55 AMG",
        "series": "CL-Class"
      },
      {
        "name": "CL 600",
        "series": "CL-Class"
      },
      {
        "name": "CL 63 AMG",
        "series": "CL-Class"
      },
      {
        "name": "CL 65 AMG",
        "series": "CL-Class"
      },
      {
        "name": "CLA 180",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 180 Shooting Brake",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 200",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 200 Shooting Brake",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 220",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 220 Shooting Brake",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 250",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 250 Shooting Brake",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 35 AMG",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 45 AMG",
        "series": "CLA-Class"
      },
      {
        "name": "CLA 45 AMG Shooting Brake",
        "series": "CLA-Class"
      },
      {
        "name": "CLA Shooting Brake",
        "series": "CLA-Class"
      },
      {
        "name": "CLC 160",
        "series": "CLC-Class"
      },
      {
        "name": "CLC 180",
        "series": "CLC-Class"
      },
      {
        "name": "CLC 200",
        "series": "CLC-Class"
      },
      {
        "name": "CLC 220",
        "series": "CLC-Class"
      },
      {
        "name": "CLC 230",
        "series": "CLC-Class"
      },
      {
        "name": "CLC 250",
        "series": "CLC-Class"
      },
      {
        "name": "CLC 350",
        "series": "CLC-Class"
      },
      {
        "name": "CLK 200",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 220",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 230",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 240",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 270",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 280",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 320",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 350",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 430",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 500",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 55 AMG",
        "series": "CLK-Class"
      },
      {
        "name": "CLK 63 AMG",
        "series": "CLK-Class"
      },
      {
        "name": "CLS 220",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 220 Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 250",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 250 Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 280",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 300",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 320",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 350",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 350 Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 400",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 400 Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 450",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 500",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 500 Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 53 AMG",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 55 AMG",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 63 AMG",
        "series": "CLS-Class"
      },
      {
        "name": "CLS 63 AMG Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "CLS Shooting Brake",
        "series": "CLS-Class"
      },
      {
        "name": "E 200",
        "series": "E-Class"
      },
      {
        "name": "E 220",
        "series": "E-Class"
      },
      {
        "name": "E 230",
        "series": "E-Class"
      },
      {
        "name": "E 240",
        "series": "E-Class"
      },
      {
        "name": "E 250",
        "series": "E-Class"
      },
      {
        "name": "E 260",
        "series": "E-Class"
      },
      {
        "name": "E 270",
        "series": "E-Class"
      },
      {
        "name": "E 280",
        "series": "E-Class"
      },
      {
        "name": "E 290",
        "series": "E-Class"
      },
      {
        "name": "E 300",
        "series": "E-Class"
      },
      {
        "name": "E 320",
        "series": "E-Class"
      },
      {
        "name": "E 350",
        "series": "E-Class"
      },
      {
        "name": "E 36 AMG",
        "series": "E-Class"
      },
      {
        "name": "E 400",
        "series": "E-Class"
      },
      {
        "name": "E 420",
        "series": "E-Class"
      },
      {
        "name": "E 43 AMG",
        "series": "E-Class"
      },
      {
        "name": "E 430",
        "series": "E-Class"
      },
      {
        "name": "E 450",
        "series": "E-Class"
      },
      {
        "name": "E 50",
        "series": "E-Class"
      },
      {
        "name": "E 500",
        "series": "E-Class"
      },
      {
        "name": "E 53 AMG",
        "series": "E-Class"
      },
      {
        "name": "E 55 AMG",
        "series": "E-Class"
      },
      {
        "name": "E 60 AMG",
        "series": "E-Class"
      },
      {
        "name": "E 63 AMG",
        "series": "E-Class"
      },
      {
        "name": "EQC"
      },
      {
        "name": "G 230",
        "series": "G-Class"
      },
      {
        "name": "G 240",
        "series": "G-Class"
      },
      {
        "name": "G 250",
        "series": "G-Class"
      },
      {
        "name": "G 270",
        "series": "G-Class"
      },
      {
        "name": "G 280",
        "series": "G-Class"
      },
      {
        "name": "G 290",
        "series": "G-Class"
      },
      {
        "name": "G 300",
        "series": "G-Class"
      },
      {
        "name": "G 320",
        "series": "G-Class"
      },
      {
        "name": "G 350",
        "series": "G-Class"
      },
      {
        "name": "G 400",
        "series": "G-Class"
      },
      {
        "name": "G 500",
        "series": "G-Class"
      },
      {
        "name": "G 55 AMG",
        "series": "G-Class"
      },
      {
        "name": "G 63 AMG",
        "series": "G-Class"
      },
      {
        "name": "G 65 AMG",
        "series": "G-Class"
      },
      {
        "name": "GL 320",
        "series": "GL-Class"
      },
      {
        "name": "GL 350",
        "series": "GL-Class"
      },
      {
        "name": "GL 400",
        "series": "GL-Class"
      },
      {
        "name": "GL 420",
        "series": "GL-Class"
      },
      {
        "name": "GL 450",
        "series": "GL-Class"
      },
      {
        "name": "GL 500",
        "series": "GL-Class"
      },
      {
        "name": "GL 55 AMG",
        "series": "GL-Class"
      },
      {
        "name": "GL 63 AMG",
        "series": "GL-Class"
      },
      {
        "name": "GLA 180",
        "series": "GLA-Class"
      },
      {
        "name": "GLA 200",
        "series": "GLA-Class"
      },
      {
        "name": "GLA 220",
        "series": "GLA-Class"
      },
      {
        "name": "GLA 250",
        "series": "GLA-Class"
      },
      {
        "name": "GLA 45 AMG",
        "series": "GLA-Class"
      },
      {
        "name": "GLB 180",
        "series": "GLB-Class"
      },
      {
        "name": "GLB 200",
        "series": "GLB-Class"
      },
      {
        "name": "GLB 220",
        "series": "GLB-Class"
      },
      {
        "name": "GLB 250",
        "series": "GLB-Class"
      },
      {
        "name": "GLC 200",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 220",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 250",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 300",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 350",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 400",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 43 AMG",
        "series": "GLC-Class"
      },
      {
        "name": "GLC 63 AMG",
        "series": "GLC-Class"
      },
      {
        "name": "GLE 250",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 300",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 350",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 400",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 43 AMG",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 450",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 500",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 53 AMG",
        "series": "GLE-Class"
      },
      {
        "name": "GLE 63 AMG",
        "series": "GLE-Class"
      },
      {
        "name": "GLK 200",
        "series": "GLK-Class"
      },
      {
        "name": "GLK 220",
        "series": "GLK-Class"
      },
      {
        "name": "GLK 250",
        "series": "GLK-Class"
      },
      {
        "name": "GLK 280",
        "series": "GLK-Class"
      },
      {
        "name": "GLK 300",
        "series": "GLK-Class"
      },
      {
        "name": "GLK 320",
        "series": "GLK-Class"
      },
      {
        "name": "GLK 350",
        "series": "GLK-Class"
      },
      {
        "name": "GLS 350",
        "series": "GLS-Class"
      },
      {
        "name": "GLS 400",
        "series": "GLS-Class"
      },
      {
        "name": "GLS 500",
        "series": "GLS-Class"
      },
      {
        "name": "GLS 63",
        "series": "GLS-Class"
      },
      {
        "name": "MB 100"
      },
      {
        "name": "ML 230",
        "series": "ML-Class"
      },
      {
        "name": "ML 250",
        "series": "ML-Class"
      },
      {
        "name": "ML 270",
        "series": "ML-Class"
      },
      {
        "name": "ML 280",
        "series": "ML-Class"
      },
      {
        "name": "ML 300",
        "series": "ML-Class"
      },
      {
        "name": "ML 320",
        "series": "ML-Class"
      },
      {
        "name": "ML 350",
        "series": "ML-Class"
      },
      {
        "name": "ML 400",
        "series": "ML-Class"
      },
      {
        "name": "ML 420",
        "series": "ML-Class"
      },
      {
        "name": "ML 430",
        "series": "ML-Class"
      },
      {
        "name": "ML 450",
        "series": "ML-Class"
      },
      {
        "name": "ML 500",
        "series": "ML-Class"
      },
      {
        "name": "ML 55 AMG",
        "series": "ML-Class"
      },
      {
        "name": "ML 63 AMG",
        "series": "ML-Class"
      },
      {
        "name": "R 280",
        "series": "R-Class"
      },
      {
        "name": "R 300",
        "series": "R-Class"
      },
      {
        "name": "R 320",
        "series": "R-Class"
      },
      {
        "name": "R 350",
        "series": "R-Class"
      },
      {
        "name": "R 500",
        "series": "R-Class"
      },
      {
        "name": "R 63 AMG",
        "series": "R-Class"
      },
      {
        "name": "S 250",
        "series": "S-Class"
      },
      {
        "name": "S 260",
        "series": "S-Class"
      },
      {
        "name": "S 280",
        "series": "S-Class"
      },
      {
        "name": "S 300",
        "series": "S-Class"
      },
      {
        "name": "S 320",
        "series": "S-Class"
      },
      {
        "name": "S 350",
        "series": "S-Class"
      },
      {
        "name": "S 400",
        "series": "S-Class"
      },
      {
        "name": "S 420",
        "series": "S-Class"
      },
      {
        "name": "S 430",
        "series": "S-Class"
      },
      {
        "name": "S 450",
        "series": "S-Class"
      },
      {
        "name": "S 500",
        "series": "S-Class"
      },
      {
        "name": "S 55",
        "series": "S-Class"
      },
      {
        "name": "S 550",
        "series": "S-Class"
      },
      {
        "name": "S 560",
        "series": "S-Class"
      },
      {
        "name": "S 600",
        "series": "S-Class"
      },
      {
        "name": "S 63 AMG",
        "series": "S-Class"
      },
      {
        "name": "S 65 AMG",
        "series": "S-Class"
      },
      {
        "name": "S 650",
        "series": "S-Class"
      },
      {
        "name": "SL 280",
        "series": "SL-Class"
      },
      {
        "name": "SL 300",
        "series": "SL-Class"
      },
      {
        "name": "SL 320",
        "series": "SL-Class"
      },
      {
        "name": "SL 350",
        "series": "SL-Class"
      },
      {
        "name": "SL 380",
        "series": "SL-Class"
      },
      {
        "name": "SL 400",
        "series": "SL-Class"
      },
      {
        "name": "SL 420",
        "series": "SL-Class"
      },
      {
        "name": "SL 450",
        "series": "SL-Class"
      },
      {
        "name": "SL 500",
        "series": "SL-Class"
      },
      {
        "name": "SL 55 AMG",
        "series": "SL-Class"
      },
      {
        "name": "SL 560",
        "series": "SL-Class"
      },
      {
        "name": "SL 60 AMG",
        "series": "SL-Class"
      },
      {
        "name": "SL 600",
        "series": "SL-Class"
      },
      {
        "name": "SL 63 AMG",
        "series": "SL-Class"
      },
      {
        "name": "SL 65 AMG",
        "series": "SL-Class"
      },
      {
        "name": "SL 70 AMG",
        "series": "SL-Class"
      },
      {
        "name": "SL 73 AMG",
        "series": "SL-Class"
      },
      {
        "name": "SLC 180",
        "series": "SLC-Class"
      },
      {
        "name": "SLC 200",
        "series": "SLC-Class"
      },
      {
        "name": "SLC 250",
        "series": "SLC-Class"
      },
      {
        "name": "SLC 280",
        "series": "SLC-Class"
      },
      {
        "name": "SLC 300",
        "series": "SLC-Class"
      },
      {
        "name": "SLC 43 AMG",
        "series": "SLC-Class"
      },
      {
        "name": "SLK 200",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 230",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 250",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 280",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 300",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 32 AMG",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 320",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 350",
        "series": "SLK-Class"
      },
      {
        "name": "SLK 55 AMG",
        "series": "SLK-Class"
      },
      {
        "name": "SLR"
      },
      {
        "name": "SLS AMG"
      },
      {
        "name": "Sprinter"
      },
      {
        "name": "V 200",
        "series": "V-Class"
      },
      {
        "name": "V 220",
        "series": "V-Class"
      },
      {
        "name": "V 230",
        "series": "V-Class"
      },
      {
        "name": "V 250",
        "series": "V-Class"
      },
      {
        "name": "V 280",
        "series": "V-Class"
      },
      {
        "name": "V 300",
        "series": "V-Class"
      },
      {
        "name": "Vaneo"
      },
      {
        "name": "Vario"
      },
      {
        "name": "Viano"
      },
      {
        "name": "Vito"
      },
      {
        "name": "X 220",
        "series": "X-Class"
      },
      {
        "name": "X 250",
        "series": "X-Class"
      },
      {
        "name": "X 350",
        "series": "X-Class"
      }
    ]
  },
  {
    "name": "MG",
    "models": [
      {
        "name": "MGA"
      },
      {
        "name": "MGB"
      },
      {
        "name": "MGF"
      },
      {
        "name": "Midget"
      },
      {
        "name": "Montego"
      },
      {
        "name": "TD"
      },
      {
        "name": "TF"
      },
      {
        "name": "ZR"
      },
      {
        "name": "ZS"
      },
      {
        "name": "ZT"
      }
    ]
  },
  {
    "name": "Microcar",
    "models": [
      {
        "name": "DUÈ"
      },
      {
        "name": "Flex"
      },
      {
        "name": "M-8"
      },
      {
        "name": "M.Go"
      },
      {
        "name": "MC1"
      },
      {
        "name": "MC2"
      },
      {
        "name": "Virgo"
      }
    ]
  },
  {
    "name": "MINI",
    "models": [
      {
        "name": "1000",
        "series": "MINI"
      },
      {
        "name": "1300",
        "series": "MINI"
      },
      {
        "name": "Clubvan"
      },
      {
        "name": "Cooper",
        "series": "MINI"
      },
      {
        "name": "Cooper Cabrio",
        "series": "Cabrio Series"
      },
      {
        "name": "Cooper Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "Cooper Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "Cooper Coupé",
        "series": "Coupe Series"
      },
      {
        "name": "Cooper D",
        "series": "MINI"
      },
      {
        "name": "Cooper D Cabrio",
        "series": "Cabrio Series"
      },
      {
        "name": "Cooper D Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "Cooper D Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "Cooper D Paceman",
        "series": "Paceman Series"
      },
      {
        "name": "Cooper Paceman",
        "series": "Paceman Series"
      },
      {
        "name": "Cooper Roadster",
        "series": "Roadster Series"
      },
      {
        "name": "Cooper S",
        "series": "MINI"
      },
      {
        "name": "Cooper S Cabrio",
        "series": "Cabrio Series"
      },
      {
        "name": "Cooper S Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "Cooper S Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "Cooper S Coupé",
        "series": "Coupe Series"
      },
      {
        "name": "Cooper S Paceman",
        "series": "Paceman Series"
      },
      {
        "name": "Cooper S Roadster",
        "series": "Roadster Series"
      },
      {
        "name": "Cooper SD",
        "series": "MINI"
      },
      {
        "name": "Cooper SD Cabrio",
        "series": "Cabrio Series"
      },
      {
        "name": "Cooper SD Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "Cooper SD Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "Cooper SD Coupé",
        "series": "Coupe Series"
      },
      {
        "name": "Cooper SD Paceman",
        "series": "Paceman Series"
      },
      {
        "name": "Cooper SD Roadster",
        "series": "Roadster Series"
      },
      {
        "name": "John Cooper Works",
        "series": "MINI"
      },
      {
        "name": "John Cooper Works Cabrio",
        "series": "Cabrio Series"
      },
      {
        "name": "John Cooper Works Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "John Cooper Works Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "John Cooper Works Coupé",
        "series": "Coupe Series"
      },
      {
        "name": "John Cooper Works Paceman",
        "series": "Paceman Series"
      },
      {
        "name": "John Cooper Works Roadster",
        "series": "Roadster Series"
      },
      {
        "name": "ONE",
        "series": "MINI"
      },
      {
        "name": "One Cabrio",
        "series": "Cabrio Series"
      },
      {
        "name": "One Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "One Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "One D",
        "series": "MINI"
      },
      {
        "name": "One D Clubman",
        "series": "Clubman Series"
      },
      {
        "name": "One D Countryman",
        "series": "Countryman Series"
      },
      {
        "name": "One First",
        "series": "MINI"
      }
    ]
  },
  {
    "name": "Mitsubishi",
    "models": [
      {
        "name": "3000 GT"
      },
      {
        "name": "ASX"
      },
      {
        "name": "Canter"
      },
      {
        "name": "Carisma"
      },
      {
        "name": "Colt"
      },
      {
        "name": "Cordia"
      },
      {
        "name": "Cosmos"
      },
      {
        "name": "Diamante"
      },
      {
        "name": "Eclipse"
      },
      {
        "name": "Eclipse Cross"
      },
      {
        "name": "Galant"
      },
      {
        "name": "Galloper"
      },
      {
        "name": "Grandis"
      },
      {
        "name": "i-MiEV"
      },
      {
        "name": "L200"
      },
      {
        "name": "L300"
      },
      {
        "name": "L400"
      },
      {
        "name": "Lancer"
      },
      {
        "name": "Mirage"
      },
      {
        "name": "Montero"
      },
      {
        "name": "Outlander"
      },
      {
        "name": "Pajero"
      },
      {
        "name": "Pajero Pinin"
      },
      {
        "name": "Pick-up"
      },
      {
        "name": "Plug-in Hybrid Outlander"
      },
      {
        "name": "Santamo"
      },
      {
        "name": "Sapporo"
      },
      {
        "name": "Sigma"
      },
      {
        "name": "Space Gear"
      },
      {
        "name": "Space Runner"
      },
      {
        "name": "Space Star"
      },
      {
        "name": "Space Wagon"
      },
      {
        "name": "Starion"
      },
      {
        "name": "Tredia"
      }
    ]
  },
  {
    "name": "Morgan",
    "models": [
      {
        "name": "3 Wheeler"
      },
      {
        "name": "4/4"
      },
      {
        "name": "Aero 8"
      },
      {
        "name": "Plus 4"
      },
      {
        "name": "Plus 8"
      },
      {
        "name": "Roadster"
      }
    ]
  },
  {
    "name": "Nissan",
    "models": [
      {
        "name": "100 NX"
      },
      {
        "name": "200 SX"
      },
      {
        "name": "240 SX"
      },
      {
        "name": "280 ZX"
      },
      {
        "name": "300 ZX"
      },
      {
        "name": "350Z"
      },
      {
        "name": "370Z"
      },
      {
        "name": "Almera"
      },
      {
        "name": "Almera Tino"
      },
      {
        "name": "Altima"
      },
      {
        "name": "Armada"
      },
      {
        "name": "Bluebird"
      },
      {
        "name": "Cabstar"
      },
      {
        "name": "Cargo"
      },
      {
        "name": "Cherry"
      },
      {
        "name": "Cube"
      },
      {
        "name": "e-NV200"
      },
      {
        "name": "Evalia"
      },
      {
        "name": "Frontier"
      },
      {
        "name": "GT-R"
      },
      {
        "name": "Interstar"
      },
      {
        "name": "Juke"
      },
      {
        "name": "King Cab"
      },
      {
        "name": "Kubistar"
      },
      {
        "name": "Laurel"
      },
      {
        "name": "Leaf"
      },
      {
        "name": "Maxima"
      },
      {
        "name": "Micra"
      },
      {
        "name": "Murano"
      },
      {
        "name": "Navara"
      },
      {
        "name": "Note"
      },
      {
        "name": "NP 300"
      },
      {
        "name": "NV200"
      },
      {
        "name": "NV250"
      },
      {
        "name": "NV300"
      },
      {
        "name": "NV400"
      },
      {
        "name": "Pathfinder"
      },
      {
        "name": "Patrol"
      },
      {
        "name": "PickUp"
      },
      {
        "name": "Pixo"
      },
      {
        "name": "Prairie"
      },
      {
        "name": "Primastar"
      },
      {
        "name": "Primera"
      },
      {
        "name": "Pulsar"
      },
      {
        "name": "Qashqai"
      },
      {
        "name": "Qashqai+2"
      },
      {
        "name": "Quest"
      },
      {
        "name": "Sentra"
      },
      {
        "name": "Serena"
      },
      {
        "name": "Silvia"
      },
      {
        "name": "Skyline"
      },
      {
        "name": "Sunny"
      },
      {
        "name": "Terrano"
      },
      {
        "name": "Tiida"
      },
      {
        "name": "Titan"
      },
      {
        "name": "Trade"
      },
      {
        "name": "Urvan"
      },
      {
        "name": "Vanette"
      },
      {
        "name": "X-Trail"
      }
    ]
  },
  {
    "name": "NSU",
    "models": []
  },
  {
    "name": "Oldsmobile",
    "models": [
      {
        "name": "Bravada"
      },
      {
        "name": "Custom Cruiser"
      },
      {
        "name": "Cutlass"
      },
      {
        "name": "Delta 88"
      },
      {
        "name": "Silhouette"
      },
      {
        "name": "Supreme"
      },
      {
        "name": "Toronado"
      }
    ]
  },
  {
    "name": "Omoda",
    "models": [
      {
        "name": "C5"
      },
      {
        "name": "S5"
      },
      {
        "name": "S5 GT"
      }
    ]
  },
  {
    "name": "Opel",
    "models": [
      {
        "name": "Adam"
      },
      {
        "name": "Agila"
      },
      {
        "name": "Ampera"
      },
      {
        "name": "Ampera-e"
      },
      {
        "name": "Antara"
      },
      {
        "name": "Arena"
      },
      {
        "name": "Ascona"
      },
      {
        "name": "Astra"
      },
      {
        "name": "Calibra"
      },
      {
        "name": "Campo"
      },
      {
        "name": "Cascada"
      },
      {
        "name": "Cavalier"
      },
      {
        "name": "Combo"
      },
      {
        "name": "Commodore"
      },
      {
        "name": "Corsa"
      },
      {
        "name": "Crossland X"
      },
      {
        "name": "Diplomat"
      },
      {
        "name": "Frontera"
      },
      {
        "name": "Grandland X"
      },
      {
        "name": "GT"
      },
      {
        "name": "Insignia"
      },
      {
        "name": "Insignia CT"
      },
      {
        "name": "Kadett"
      },
      {
        "name": "Karl"
      },
      {
        "name": "Manta"
      },
      {
        "name": "Meriva"
      },
      {
        "name": "Mokka"
      },
      {
        "name": "Mokka X"
      },
      {
        "name": "Monterey"
      },
      {
        "name": "Monza"
      },
      {
        "name": "Movano"
      },
      {
        "name": "Nova"
      },
      {
        "name": "Omega"
      },
      {
        "name": "Pick Up Sportscap"
      },
      {
        "name": "Rekord"
      },
      {
        "name": "Senator"
      },
      {
        "name": "Signum"
      },
      {
        "name": "Sintra"
      },
      {
        "name": "Speedster"
      },
      {
        "name": "Tigra"
      },
      {
        "name": "Vectra"
      },
      {
        "name": "Vivaro"
      },
      {
        "name": "Zafira"
      },
      {
        "name": "Zafira Life"
      },
      {
        "name": "Zafira Tourer"
      }
    ]
  },
  {
    "name": "Other",
    "models": []
  },
  {
    "name": "Pagani",
    "models": [
      {
        "name": "Huayra"
      },
      {
        "name": "Zonda"
      }
    ]
  },
  {
    "name": "Peugeot",
    "models": [
      {
        "name": "1007"
      },
      {
        "name": "104"
      },
      {
        "name": "106"
      },
      {
        "name": "107"
      },
      {
        "name": "108"
      },
      {
        "name": "2008"
      },
      {
        "name": "204"
      },
      {
        "name": "205"
      },
      {
        "name": "206"
      },
      {
        "name": "207"
      },
      {
        "name": "208"
      },
      {
        "name": "3008"
      },
      {
        "name": "301"
      },
      {
        "name": "304"
      },
      {
        "name": "305"
      },
      {
        "name": "306"
      },
      {
        "name": "307"
      },
      {
        "name": "308"
      },
      {
        "name": "309"
      },
      {
        "name": "4007"
      },
      {
        "name": "4008"
      },
      {
        "name": "404"
      },
      {
        "name": "405"
      },
      {
        "name": "406"
      },
      {
        "name": "407"
      },
      {
        "name": "5008"
      },
      {
        "name": "504"
      },
      {
        "name": "505"
      },
      {
        "name": "508"
      },
      {
        "name": "604"
      },
      {
        "name": "605"
      },
      {
        "name": "607"
      },
      {
        "name": "806"
      },
      {
        "name": "807"
      },
      {
        "name": "Bipper"
      },
      {
        "name": "Bipper Tepee"
      },
      {
        "name": "Boxer"
      },
      {
        "name": "Expert"
      },
      {
        "name": "Expert Tepee"
      },
      {
        "name": "iOn"
      },
      {
        "name": "J5"
      },
      {
        "name": "Partner"
      },
      {
        "name": "Partner Tepee"
      },
      {
        "name": "RCZ"
      },
      {
        "name": "Rifter"
      },
      {
        "name": "TePee"
      },
      {
        "name": "Traveller"
      }
    ]
  },
  {
    "name": "Piaggio",
    "models": [
      {
        "name": "APE"
      },
      {
        "name": "APE TM"
      },
      {
        "name": "Porter"
      }
    ]
  },
  {
    "name": "Plymouth",
    "models": [
      {
        "name": "Prowler"
      }
    ]
  },
  {
    "name": "Polestar",
    "models": [
      {
        "name": "1"
      }
    ]
  },
  {
    "name": "Pontiac",
    "models": [
      {
        "name": "6000"
      },
      {
        "name": "Bonneville"
      },
      {
        "name": "Fiero"
      },
      {
        "name": "Firebird"
      },
      {
        "name": "G6"
      },
      {
        "name": "Grand-Am"
      },
      {
        "name": "Grand-Prix"
      },
      {
        "name": "GTO"
      },
      {
        "name": "Montana"
      },
      {
        "name": "Solstice"
      },
      {
        "name": "Sunbird"
      },
      {
        "name": "Sunfire"
      },
      {
        "name": "Targa"
      },
      {
        "name": "Trans Am"
      },
      {
        "name": "Trans Sport"
      },
      {
        "name": "Vibe"
      }
    ]
  },
  {
    "name": "Porsche",
    "models": [
      {
        "name": "356"
      },
      {
        "name": "911",
        "series": "Series 911"
      },
      {
        "name": "912"
      },
      {
        "name": "914"
      },
      {
        "name": "918"
      },
      {
        "name": "924"
      },
      {
        "name": "928"
      },
      {
        "name": "930",
        "series": "Series 911"
      },
      {
        "name": "944"
      },
      {
        "name": "959"
      },
      {
        "name": "962"
      },
      {
        "name": "964",
        "series": "Series 911"
      },
      {
        "name": "968"
      },
      {
        "name": "991",
        "series": "Series 911"
      },
      {
        "name": "992",
        "series": "Series 911"
      },
      {
        "name": "993",
        "series": "Series 911"
      },
      {
        "name": "996",
        "series": "Series 911"
      },
      {
        "name": "997",
        "series": "Series 911"
      },
      {
        "name": "Boxster"
      },
      {
        "name": "Carrera GT"
      },
      {
        "name": "Cayenne"
      },
      {
        "name": "Cayman"
      },
      {
        "name": "Macan"
      },
      {
        "name": "Panamera"
      },
      {
        "name": "Taycan"
      }
    ]
  },
  {
    "name": "Proton",
    "models": [
      {
        "name": "300 Serie"
      },
      {
        "name": "400 Serie"
      }
    ]
  },
  {
    "name": "Renault",
    "models": [
      {
        "name": "Alaskan"
      },
      {
        "name": "Alpine A110"
      },
      {
        "name": "Alpine A310"
      },
      {
        "name": "Alpine V6"
      },
      {
        "name": "Avantime"
      },
      {
        "name": "Captur"
      },
      {
        "name": "Clio"
      },
      {
        "name": "Coupe"
      },
      {
        "name": "Espace"
      },
      {
        "name": "Express"
      },
      {
        "name": "Fluence"
      },
      {
        "name": "Fuego"
      },
      {
        "name": "Grand Espace"
      },
      {
        "name": "Grand Modus"
      },
      {
        "name": "Grand Scenic"
      },
      {
        "name": "Kadjar"
      },
      {
        "name": "Kangoo"
      },
      {
        "name": "Koleos"
      },
      {
        "name": "Laguna"
      },
      {
        "name": "Latitude"
      },
      {
        "name": "Mascott"
      },
      {
        "name": "Master"
      },
      {
        "name": "Megane"
      },
      {
        "name": "Modus"
      },
      {
        "name": "P 1400"
      },
      {
        "name": "R 11"
      },
      {
        "name": "R 14"
      },
      {
        "name": "R 18"
      },
      {
        "name": "R 19"
      },
      {
        "name": "R 20"
      },
      {
        "name": "R 21"
      },
      {
        "name": "R 25"
      },
      {
        "name": "R 30"
      },
      {
        "name": "R 4"
      },
      {
        "name": "R 5"
      },
      {
        "name": "R 6"
      },
      {
        "name": "R 9"
      },
      {
        "name": "Rapid"
      },
      {
        "name": "Safrane"
      },
      {
        "name": "Scenic"
      },
      {
        "name": "Spider"
      },
      {
        "name": "Talisman"
      },
      {
        "name": "Trafic"
      },
      {
        "name": "Twingo"
      },
      {
        "name": "Twizy"
      },
      {
        "name": "Vel Satis"
      },
      {
        "name": "Wind"
      },
      {
        "name": "ZOE"
      }
    ]
  },
  {
    "name": "Rolls-Royce",
    "models": [
      {
        "name": "Corniche"
      },
      {
        "name": "Cullinan"
      },
      {
        "name": "Dawn"
      },
      {
        "name": "Flying Spur"
      },
      {
        "name": "Ghost"
      },
      {
        "name": "Park Ward"
      },
      {
        "name": "Phantom"
      },
      {
        "name": "Silver Cloud"
      },
      {
        "name": "Silver Dawn"
      },
      {
        "name": "Silver Seraph"
      },
      {
        "name": "Silver Shadow"
      },
      {
        "name": "Silver Spirit"
      },
      {
        "name": "Silver Spur"
      },
      {
        "name": "Wraith"
      }
    ]
  },
  {
    "name": "Rover",
    "models": [
      {
        "name": "100"
      },
      {
        "name": "111"
      },
      {
        "name": "114"
      },
      {
        "name": "115"
      },
      {
        "name": "200"
      },
      {
        "name": "213"
      },
      {
        "name": "214"
      },
      {
        "name": "216"
      },
      {
        "name": "218"
      },
      {
        "name": "220"
      },
      {
        "name": "25"
      },
      {
        "name": "400"
      },
      {
        "name": "414"
      },
      {
        "name": "416"
      },
      {
        "name": "418"
      },
      {
        "name": "420"
      },
      {
        "name": "45"
      },
      {
        "name": "600"
      },
      {
        "name": "618"
      },
      {
        "name": "620"
      },
      {
        "name": "623"
      },
      {
        "name": "75"
      },
      {
        "name": "800"
      },
      {
        "name": "820"
      },
      {
        "name": "825"
      },
      {
        "name": "827"
      },
      {
        "name": "City Rover"
      },
      {
        "name": "Metro"
      },
      {
        "name": "Montego"
      },
      {
        "name": "SD"
      },
      {
        "name": "Streetwise"
      }
    ]
  },
  {
    "name": "Ruf",
    "models": []
  },
  {
    "name": "Saab",
    "models": [
      {
        "name": "9-3"
      },
      {
        "name": "9-4X"
      },
      {
        "name": "9-5"
      },
      {
        "name": "9-7X"
      },
      {
        "name": "90"
      },
      {
        "name": "900"
      },
      {
        "name": "9000"
      },
      {
        "name": "96"
      },
      {
        "name": "99"
      }
    ]
  },
  {
    "name": "Santana",
    "models": []
  },
  {
    "name": "Seat",
    "models": [
      {
        "name": "Alhambra"
      },
      {
        "name": "Altea"
      },
      {
        "name": "Arona"
      },
      {
        "name": "Arosa"
      },
      {
        "name": "Ateca"
      },
      {
        "name": "Cordoba"
      },
      {
        "name": "Exeo"
      },
      {
        "name": "Ibiza"
      },
      {
        "name": "Inca"
      },
      {
        "name": "Leon"
      },
      {
        "name": "Malaga"
      },
      {
        "name": "Marbella"
      },
      {
        "name": "Mii"
      },
      {
        "name": "Tarraco"
      },
      {
        "name": "Terra"
      },
      {
        "name": "Toledo"
      }
    ]
  },
  {
    "name": "Skoda",
    "models": [
      {
        "name": "105"
      },
      {
        "name": "120"
      },
      {
        "name": "130"
      },
      {
        "name": "135"
      },
      {
        "name": "Citigo"
      },
      {
        "name": "Fabia"
      },
      {
        "name": "Favorit"
      },
      {
        "name": "Felicia"
      },
      {
        "name": "Forman"
      },
      {
        "name": "Kamiq"
      },
      {
        "name": "Karoq"
      },
      {
        "name": "Kodiaq"
      },
      {
        "name": "Octavia"
      },
      {
        "name": "Pick-up"
      },
      {
        "name": "Praktik"
      },
      {
        "name": "Rapid"
      },
      {
        "name": "Roomster"
      },
      {
        "name": "Scala"
      },
      {
        "name": "Superb"
      },
      {
        "name": "Yeti"
      }
    ]
  },
  {
    "name": "Smart",
    "models": [
      {
        "name": "Crossblade"
      },
      {
        "name": "ForFour"
      },
      {
        "name": "ForTwo"
      },
      {
        "name": "Roadster"
      }
    ]
  },
  {
    "name": "speedART",
    "models": []
  },
  {
    "name": "Spyker",
    "models": [
      {
        "name": "C8"
      },
      {
        "name": "C8 AILERON"
      },
      {
        "name": "C8 DOUBLE 12 S"
      },
      {
        "name": "C8 LAVIOLETTE SWB"
      },
      {
        "name": "C8 SPYDER SWB"
      }
    ]
  },
  {
    "name": "Ssangyong",
    "models": [
      {
        "name": "Actyon"
      },
      {
        "name": "Family"
      },
      {
        "name": "Korando"
      },
      {
        "name": "Kyron"
      },
      {
        "name": "MUSSO"
      },
      {
        "name": "REXTON"
      },
      {
        "name": "Rodius"
      },
      {
        "name": "Tivoli"
      },
      {
        "name": "XLV"
      }
    ]
  },
  {
    "name": "Subaru",
    "models": [
      {
        "name": "B9 Tribeca"
      },
      {
        "name": "Baja"
      },
      {
        "name": "BRZ"
      },
      {
        "name": "Forester"
      },
      {
        "name": "Impreza"
      },
      {
        "name": "Justy"
      },
      {
        "name": "Legacy"
      },
      {
        "name": "Levorg"
      },
      {
        "name": "Libero"
      },
      {
        "name": "Outback"
      },
      {
        "name": "SVX"
      },
      {
        "name": "Trezia"
      },
      {
        "name": "Tribeca"
      },
      {
        "name": "Vivio"
      },
      {
        "name": "WRX STI"
      },
      {
        "name": "XT"
      },
      {
        "name": "XV"
      }
    ]
  },
  {
    "name": "Suzuki",
    "models": [
      {
        "name": "Alto"
      },
      {
        "name": "Baleno"
      },
      {
        "name": "Cappuccino"
      },
      {
        "name": "Carry"
      },
      {
        "name": "Celerio"
      },
      {
        "name": "Grand Vitara"
      },
      {
        "name": "Ignis"
      },
      {
        "name": "iK-2"
      },
      {
        "name": "Jimny"
      },
      {
        "name": "Kizashi"
      },
      {
        "name": "Liana"
      },
      {
        "name": "LJ"
      },
      {
        "name": "SJ Samurai"
      },
      {
        "name": "Splash"
      },
      {
        "name": "Super-Carry"
      },
      {
        "name": "Swift"
      },
      {
        "name": "SX4"
      },
      {
        "name": "SX4 S-Cross"
      },
      {
        "name": "Vitara"
      },
      {
        "name": "Wagon R+"
      },
      {
        "name": "X-90"
      }
    ]
  },
  {
    "name": "Talbot",
    "models": [
      {
        "name": "Horizon"
      },
      {
        "name": "Samba"
      }
    ]
  },
  {
    "name": "Tank",
    "models": [
      {
        "name": "300"
      },
      {
        "name": "400"
      },
      {
        "name": "500"
      },
      {
        "name": "700"
      }
    ]
  },
  {
    "name": "Tata",
    "models": [
      {
        "name": "Indica"
      },
      {
        "name": "Indigo"
      },
      {
        "name": "Nano"
      },
      {
        "name": "Safari"
      },
      {
        "name": "Sumo"
      },
      {
        "name": "Telcoline"
      },
      {
        "name": "Telcosport"
      },
      {
        "name": "Xenon"
      }
    ]
  },
  {
    "name": "TECHART",
    "models": []
  },
  {
    "name": "Tesla",
    "models": [
      {
        "name": "Model 3"
      },
      {
        "name": "Model S"
      },
      {
        "name": "Model X"
      },
      {
        "name": "Roadster"
      }
    ]
  },
  {
    "name": "Toyota",
    "models": [
      {
        "name": "4-Runner"
      },
      {
        "name": "Alphard"
      },
      {
        "name": "Auris"
      },
      {
        "name": "Auris Touring Sports"
      },
      {
        "name": "Avalon"
      },
      {
        "name": "Avensis"
      },
      {
        "name": "Avensis Verso"
      },
      {
        "name": "Aygo"
      },
      {
        "name": "C-HR"
      },
      {
        "name": "Camry"
      },
      {
        "name": "Carina"
      },
      {
        "name": "Celica"
      },
      {
        "name": "Corolla"
      },
      {
        "name": "Corolla Verso"
      },
      {
        "name": "Cressida"
      },
      {
        "name": "Crown"
      },
      {
        "name": "Dyna"
      },
      {
        "name": "FCV"
      },
      {
        "name": "FJ"
      },
      {
        "name": "Fortuner"
      },
      {
        "name": "GT86"
      },
      {
        "name": "Hiace"
      },
      {
        "name": "Highlander"
      },
      {
        "name": "Hilux"
      },
      {
        "name": "IQ"
      },
      {
        "name": "Land Cruiser"
      },
      {
        "name": "Lite-Ace"
      },
      {
        "name": "Matrix"
      },
      {
        "name": "Mirai"
      },
      {
        "name": "MR 2"
      },
      {
        "name": "Paseo"
      },
      {
        "name": "Picnic"
      },
      {
        "name": "Previa"
      },
      {
        "name": "Prius"
      },
      {
        "name": "Prius+"
      },
      {
        "name": "Proace (Verso)"
      },
      {
        "name": "RAV 4"
      },
      {
        "name": "Sequoia"
      },
      {
        "name": "Sienna"
      },
      {
        "name": "Starlet"
      },
      {
        "name": "Supra"
      },
      {
        "name": "Tacoma"
      },
      {
        "name": "Tercel"
      },
      {
        "name": "Tundra"
      },
      {
        "name": "Urban Cruiser"
      },
      {
        "name": "Verso"
      },
      {
        "name": "Verso-S"
      },
      {
        "name": "Yaris"
      }
    ]
  },
  {
    "name": "Trabant",
    "models": [
      {
        "name": "601"
      }
    ]
  },
  {
    "name": "Triumph",
    "models": [
      {
        "name": "Dolomite"
      },
      {
        "name": "Moss"
      },
      {
        "name": "Spitfire"
      },
      {
        "name": "TR3"
      },
      {
        "name": "TR4"
      },
      {
        "name": "TR5"
      },
      {
        "name": "TR6"
      },
      {
        "name": "TR7"
      },
      {
        "name": "TR8"
      }
    ]
  },
  {
    "name": "TVR",
    "models": [
      {
        "name": "Chimaera"
      },
      {
        "name": "Griffith"
      },
      {
        "name": "Tuscan"
      }
    ]
  },
  {
    "name": "UAZ",
    "models": [
      {
        "name": "Bukhanka"
      },
      {
        "name": "Hunter"
      },
      {
        "name": "Patriot"
      },
      {
        "name": "Pickup"
      },
      {
        "name": "Profi"
      }
    ]
  },
  {
    "name": "Volkswagen",
    "models": [
      {
        "name": "181"
      },
      {
        "name": "Amarok"
      },
      {
        "name": "Arteon"
      },
      {
        "name": "Beetle"
      },
      {
        "name": "Bora"
      },
      {
        "name": "Buggy"
      },
      {
        "name": "Caddy"
      },
      {
        "name": "CC"
      },
      {
        "name": "Corrado"
      },
      {
        "name": "Crafter"
      },
      {
        "name": "Eos"
      },
      {
        "name": "Fox"
      },
      {
        "name": "Golf",
        "series": "Golf"
      },
      {
        "name": "Golf Plus",
        "series": "Golf"
      },
      {
        "name": "Golf Sportsvan",
        "series": "Golf"
      },
      {
        "name": "Iltis"
      },
      {
        "name": "Jetta"
      },
      {
        "name": "Karmann Ghia"
      },
      {
        "name": "LT"
      },
      {
        "name": "Lupo"
      },
      {
        "name": "New Beetle"
      },
      {
        "name": "Passat",
        "series": "Passat"
      },
      {
        "name": "Passat Alltrack",
        "series": "Passat"
      },
      {
        "name": "Passat CC",
        "series": "Passat"
      },
      {
        "name": "Passat Variant",
        "series": "Passat"
      },
      {
        "name": "Phaeton"
      },
      {
        "name": "Polo"
      },
      {
        "name": "Routan"
      },
      {
        "name": "Santana"
      },
      {
        "name": "Scirocco"
      },
      {
        "name": "Sharan"
      },
      {
        "name": "T-Cross"
      },
      {
        "name": "T-Roc"
      },
      {
        "name": "T1"
      },
      {
        "name": "T2"
      },
      {
        "name": "T3 Caravelle",
        "series": "T3"
      },
      {
        "name": "T3 Kombi",
        "series": "T3"
      },
      {
        "name": "T3 Multivan",
        "series": "T3"
      },
      {
        "name": "T3 other",
        "series": "T3"
      },
      {
        "name": "T4 California",
        "series": "T4"
      },
      {
        "name": "T4 Caravelle",
        "series": "T4"
      },
      {
        "name": "T4 Kombi",
        "series": "T4"
      },
      {
        "name": "T4 Multivan",
        "series": "T4"
      },
      {
        "name": "T4 other",
        "series": "T4"
      },
      {
        "name": "T5 California",
        "series": "T5"
      },
      {
        "name": "T5 Caravelle",
        "series": "T5"
      },
      {
        "name": "T5 Kombi",
        "series": "T5"
      },
      {
        "name": "T5 Multivan",
        "series": "T5"
      },
      {
        "name": "T5 other",
        "series": "T5"
      },
      {
        "name": "T5 Shuttle",
        "series": "T5"
      },
      {
        "name": "T5 Transporter",
        "series": "T5"
      },
      {
        "name": "T6 California",
        "series": "T6"
      },
      {
        "name": "T6 Caravelle",
        "series": "T6"
      },
      {
        "name": "T6 Kombi",
        "series": "T6"
      },
      {
        "name": "T6 Multivan",
        "series": "T6"
      },
      {
        "name": "T6 other",
        "series": "T6"
      },
      {
        "name": "T6 Transporter",
        "series": "T6"
      },
      {
        "name": "Taro"
      },
      {
        "name": "Tiguan"
      },
      {
        "name": "Tiguan Allspace"
      },
      {
        "name": "Touareg"
      },
      {
        "name": "Touran"
      },
      {
        "name": "up!"
      },
      {
        "name": "Vento"
      },
      {
        "name": "XL1"
      }
    ]
  },
  {
    "name": "Volvo",
    "models": [
      {
        "name": "240"
      },
      {
        "name": "244"
      },
      {
        "name": "245"
      },
      {
        "name": "262"
      },
      {
        "name": "264"
      },
      {
        "name": "340"
      },
      {
        "name": "360"
      },
      {
        "name": "440"
      },
      {
        "name": "460"
      },
      {
        "name": "480"
      },
      {
        "name": "740"
      },
      {
        "name": "744"
      },
      {
        "name": "745"
      },
      {
        "name": "760"
      },
      {
        "name": "780"
      },
      {
        "name": "850"
      },
      {
        "name": "855"
      },
      {
        "name": "940"
      },
      {
        "name": "944"
      },
      {
        "name": "945"
      },
      {
        "name": "960"
      },
      {
        "name": "965"
      },
      {
        "name": "Amazon"
      },
      {
        "name": "C30"
      },
      {
        "name": "C70"
      },
      {
        "name": "Polar"
      },
      {
        "name": "S40"
      },
      {
        "name": "S60"
      },
      {
        "name": "S60 Cross Country"
      },
      {
        "name": "S70"
      },
      {
        "name": "S80"
      },
      {
        "name": "S90"
      },
      {
        "name": "V40"
      },
      {
        "name": "V40 Cross Country"
      },
      {
        "name": "V50"
      },
      {
        "name": "V60"
      },
      {
        "name": "V60 Cross Country"
      },
      {
        "name": "V70"
      },
      {
        "name": "V90"
      },
      {
        "name": "V90 Cross Country"
      },
      {
        "name": "XC40"
      },
      {
        "name": "XC60"
      },
      {
        "name": "XC70"
      },
      {
        "name": "XC90"
      }
    ]
  },
  {
    "name": "Voyah",
    "models": [
      {
        "name": "Dream"
      },
      {
        "name": "Free"
      },
      {
        "name": "Passion"
      }
    ]
  },
  {
    "name": "Wartburg",
    "models": [
      {
        "name": "311"
      },
      {
        "name": "353"
      }
    ]
  },
  {
    "name": "Westfield",
    "models": []
  },
  {
    "name": "Wiesmann",
    "models": [
      {
        "name": "MF 25"
      },
      {
        "name": "MF 28"
      },
      {
        "name": "MF 3"
      },
      {
        "name": "MF 30"
      },
      {
        "name": "MF 35"
      },
      {
        "name": "MF 4"
      },
      {
        "name": "MF 5"
      }
    ]
  },
  {
    "name": "Zeekr",
    "models": [
      {
        "name": "001"
      },
      {
        "name": "007"
      },
      {
        "name": "009"
      },
      {
        "name": "7X"
      },
      {
        "name": "X"
      }
    ]
  }
];

export const CAR_MAKES = CAR_CATALOG.map((make) => make.name);

function normalizeCarCatalogValue(value: string) {
  return value.trim().toLowerCase();
}

export function getModelsForMake(make: string) {
  const normalizedMake = normalizeCarCatalogValue(make);

  return (
    CAR_CATALOG.find((entry) => normalizeCarCatalogValue(entry.name) === normalizedMake)?.models.map((model) => model.name) ?? []
  );
}
