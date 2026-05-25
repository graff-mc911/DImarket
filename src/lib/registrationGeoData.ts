/** Shared country / region / city tree (same as registration form). */
export type RegistrationGeoData = Record<string, Record<string, string[]>>

export const REGISTRATION_GEO_DATA: Record<string, Record<string, string[]>> = {
  // EUROPE
  'Ukraine': {
    'Kyiv Oblast':         ['Kyiv','Boryspil','Brovary','Bila Tserkva'],
    'Lviv Oblast':         ['Lviv','Drohobych','Stryi','Truskavets'],
    'Odesa Oblast':        ['Odesa','Izmail','Chornomorsk'],
    'Kharkiv Oblast':      ['Kharkiv','Sumy','Poltava'],
    'Dnipro Oblast':       ['Dnipro','Kryvyi Rih','Nikopol'],
    'Zaporizhzhia Oblast': ['Zaporizhzhia','Melitopol'],
    'Vinnytsia Oblast':    ['Vinnytsia'],
    'Zakarpattia Oblast':  ['Uzhhorod','Mukachevo'],
    'Chernivtsi Oblast':   ['Chernivtsi'],
  },
  'Poland': {
    'Masovian':            ['Warsaw','Radom'],
    'Lesser Poland':       ['Krakow','Tarnow'],
    'Silesian':            ['Katowice','Czestochowa','Gliwice'],
    'Greater Poland':      ['Poznan','Kalisz'],
    'Lower Silesian':      ['Wroclaw','Legnica'],
    'Pomeranian':          ['Gdansk','Gdynia','Sopot'],
    'Lodz':                ['Lodz'],
    'Subcarpathian':       ['Rzeszow','Przemysl'],
  },
  'Germany': {
    'Bavaria':             ['Munich','Nuremberg','Augsburg'],
    'Berlin':              ['Berlin'],
    'Hessen':              ['Frankfurt','Wiesbaden','Darmstadt'],
    'Hamburg':             ['Hamburg'],
    'Baden-Württemberg':   ['Stuttgart','Karlsruhe','Freiburg'],
    'North Rhine-Westphalia':['Cologne','Düsseldorf','Dortmund','Essen'],
    'Saxony':              ['Dresden','Leipzig'],
    'Brandenburg':         ['Potsdam'],
  },
  'Spain': {
    'Catalonia':           ['Barcelona','Girona','Tarragona'],
    'Valencia':            ['Valencia','Alicante','Torrevieja'],
    'Madrid':              ['Madrid'],
    'Andalusia':           ['Seville','Malaga','Granada'],
    'Basque Country':      ['Bilbao','San Sebastian'],
    'Balearic Islands':    ['Palma','Ibiza'],
    'Canary Islands':      ['Las Palmas','Santa Cruz de Tenerife'],
  },
  'France': {
    'Île-de-France':       ['Paris','Versailles'],
    'Provence':            ['Marseille','Nice','Toulon'],
    'Auvergne-Rhône-Alpes':['Lyon','Grenoble'],
    'Occitanie':           ['Toulouse','Montpellier'],
    'New Aquitaine':       ['Bordeaux','Limoges'],
    'Brittany':            ['Rennes','Brest'],
  },
  'Italy': {
    'Lombardy':            ['Milan','Bergamo','Brescia'],
    'Lazio':               ['Rome','Latina'],
    'Campania':            ['Naples','Salerno'],
    'Sicily':              ['Palermo','Catania'],
    'Veneto':              ['Venice','Verona','Padua'],
    'Tuscany':             ['Florence','Siena'],
    'Emilia-Romagna':      ['Bologna','Modena','Parma'],
  },
  'Czech Republic': {
    'Prague':              ['Prague'],
    'Central Bohemia':     ['Kladno'],
    'Pilsen':              ['Pilsen'],
    'Moravia-Silesia':     ['Ostrava','Opava'],
    'South Moravia':       ['Brno','Znojmo'],
  },
  'Slovakia': {
    'Bratislava':          ['Bratislava'],
    'Trnava':              ['Trnava'],
    'Nitra':               ['Nitra','Komarno'],
    'Banska Bystrica':     ['Banska Bystrica'],
    'Kosice':              ['Kosice'],
  },
  'Hungary': {
    'Budapest':            ['Budapest'],
    'Gyor-Moson-Sopron':   ['Gyor','Sopron'],
    'Borsod':              ['Miskolc'],
    'Hajdu-Bihar':         ['Debrecen'],
    'Csongrad-Csanad':     ['Szeged'],
  },
  'Romania': {
    'Bucharest':           ['Bucharest'],
    'Cluj':                ['Cluj-Napoca'],
    'Timis':               ['Timisoara'],
    'Constanta':           ['Constanta'],
    'Iasi':                ['Iasi'],
  },
  'Austria': {
    'Vienna':              ['Vienna'],
    'Lower Austria':       ['St. Pölten','Krems'],
    'Upper Austria':       ['Linz','Wels'],
    'Styria':              ['Graz'],
    'Tyrol':               ['Innsbruck'],
    'Salzburg':            ['Salzburg'],
  },
  'United Kingdom': {
    'England':             ['London','Manchester','Birmingham','Leeds','Liverpool'],
    'Scotland':            ['Edinburgh','Glasgow','Aberdeen'],
    'Wales':               ['Cardiff','Swansea'],
    'Northern Ireland':    ['Belfast'],
  },
  'Netherlands': {
    'North Holland':       ['Amsterdam','Haarlem'],
    'South Holland':       ['Rotterdam','The Hague','Delft'],
    'Utrecht':             ['Utrecht'],
    'North Brabant':       ['Eindhoven','Tilburg'],
  },
  'Belgium': {
    'Brussels':            ['Brussels'],
    'Flanders':            ['Antwerp','Ghent','Bruges'],
    'Wallonia':            ['Liège','Namur','Charleroi'],
  },
  'Portugal': {
    'Lisbon':              ['Lisbon','Sintra','Cascais'],
    'Porto':               ['Porto','Braga'],
    'Algarve':             ['Faro','Portimao'],
  },
  'Greece': {
    'Attica':              ['Athens','Piraeus'],
    'Central Macedonia':   ['Thessaloniki','Kavala'],
    'Crete':               ['Heraklion','Chania'],
  },
  'Bulgaria': {
    'Sofia':               ['Sofia'],
    'Plovdiv':             ['Plovdiv'],
    'Varna':               ['Varna','Dobrich'],
    'Burgas':              ['Burgas'],
  },
  'Croatia': {
    'Zagreb':              ['Zagreb'],
    'Split-Dalmatia':      ['Split','Dubrovnik'],
    'Rijeka':              ['Rijeka','Pula'],
  },
  'Serbia': {
    'Belgrade':            ['Belgrade'],
    'South Backa':         ['Novi Sad','Subotica'],
    'Nisava':              ['Nis'],
  },
  'Switzerland': {
    'Zurich':              ['Zurich'],
    'Geneva':              ['Geneva'],
    'Bern':                ['Bern'],
    'Basel':               ['Basel'],
  },
  'Kazakhstan': {
    'Astana':              ['Astana'],
    'Almaty':              ['Almaty'],
    'Shymkent':            ['Shymkent'],
    'Aktobe':              ['Aktobe'],
    'Karaganda':           ['Karaganda'],
  },
  'UAE': {
    'Dubai':               ['Dubai'],
    'Abu Dhabi':           ['Abu Dhabi','Al Ain'],
    'Sharjah':             ['Sharjah'],
  },
  // AMERICAS
  'USA': {
    'California':          ['Los Angeles','San Francisco','San Diego','San Jose','Fresno'],
    'New York':            ['New York','Buffalo','Rochester'],
    'Texas':               ['Houston','Dallas','Austin','San Antonio'],
    'Florida':             ['Miami','Orlando','Tampa','Jacksonville'],
    'Illinois':            ['Chicago','Aurora','Rockford'],
    'Pennsylvania':        ['Philadelphia','Pittsburgh'],
    'Ohio':                ['Columbus','Cleveland','Cincinnati'],
    'Georgia':             ['Atlanta','Savannah'],
    'Washington':          ['Seattle','Spokane','Tacoma'],
    'Arizona':             ['Phoenix','Tucson','Scottsdale'],
    'Massachusetts':       ['Boston','Springfield'],
    'Nevada':              ['Las Vegas','Reno'],
    'Michigan':            ['Detroit','Grand Rapids'],
    'Colorado':            ['Denver','Colorado Springs'],
    'North Carolina':      ['Charlotte','Raleigh'],
    'Minnesota':           ['Minneapolis','Saint Paul'],
    'New Jersey':          ['Newark','Jersey City'],
    'Virginia':            ['Virginia Beach','Norfolk'],
    'Tennessee':           ['Nashville','Memphis'],
    'Missouri':            ['Saint Louis','Kansas City'],
  },
  'Canada': {
    'Ontario':             ['Toronto','Ottawa','Mississauga','Hamilton'],
    'British Columbia':    ['Vancouver','Surrey','Burnaby'],
    'Quebec':              ['Montreal','Quebec City','Laval'],
    'Alberta':             ['Calgary','Edmonton'],
    'Manitoba':            ['Winnipeg'],
    'Saskatchewan':        ['Saskatoon','Regina'],
    'Nova Scotia':         ['Halifax'],
  },
  'Mexico': {
    'Mexico City':         ['Mexico City'],
    'Jalisco':             ['Guadalajara','Zapopan','Tlaquepaque'],
    'Nuevo León':          ['Monterrey','San Nicolas'],
    'Puebla':              ['Puebla'],
    'Guerrero':            ['Acapulco'],
    'Quintana Roo':        ['Cancun','Playa del Carmen'],
    'Yucatan':             ['Merida'],
    'Baja California':     ['Tijuana','Mexicali'],
    'Chihuahua':           ['Chihuahua','Ciudad Juarez'],
    'Tamaulipas':          ['Matamoros','Reynosa'],
  },
  'Brazil': {
    'São Paulo':           ['São Paulo','Guarulhos','Campinas','Santo André'],
    'Rio de Janeiro':      ['Rio de Janeiro','Niterói','Duque de Caxias'],
    'Minas Gerais':        ['Belo Horizonte','Uberlândia'],
    'Bahia':               ['Salvador','Feira de Santana'],
    'Paraná':              ['Curitiba','Londrina'],
    'Rio Grande do Sul':   ['Porto Alegre','Caxias do Sul'],
    'Pernambuco':          ['Recife','Olinda'],
    'Ceará':               ['Fortaleza'],
    'Amazonas':            ['Manaus'],
    'Pará':                ['Belém'],
  },
  'Argentina': {
    'Buenos Aires':        ['Buenos Aires','La Plata','Mar del Plata'],
    'Córdoba':             ['Córdoba'],
    'Santa Fe':            ['Rosario','Santa Fe'],
    'Mendoza':             ['Mendoza'],
    'Tucumán':             ['San Miguel de Tucumán'],
    'Salta':               ['Salta'],
  },
  'Colombia': {
    'Cundinamarca':        ['Bogotá'],
    'Antioquia':           ['Medellín','Bello','Itagüí'],
    'Valle del Cauca':     ['Cali','Palmira'],
    'Atlántico':           ['Barranquilla'],
    'Bolívar':             ['Cartagena'],
  },
  'Chile': {
    'Metropolitan':        ['Santiago','Puente Alto','Maipú'],
    'Valparaíso':          ['Valparaíso','Viña del Mar'],
    'Biobío':              ['Concepción','Talcahuano'],
  },
  'Peru': {
    'Lima':                ['Lima','Callao'],
    'Arequipa':            ['Arequipa'],
    'La Libertad':         ['Trujillo'],
    'Lambayeque':          ['Chiclayo'],
  },
  'Venezuela': {
    'Capital District':    ['Caracas'],
    'Miranda':             ['Los Teques','Guatire'],
    'Zulia':               ['Maracaibo'],
    'Carabobo':            ['Valencia'],
    'Aragua':              ['Maracay'],
    'Bolívar':             ['Ciudad Bolívar'],
  },
  'Ecuador': {
    'Guayas':              ['Guayaquil','Samborondón'],
    'Pichincha':           ['Quito','Sangolquí'],
    'Manabí':              ['Manta','Portoviejo'],
  },
  'Bolivia': {
    'Santa Cruz':          ['Santa Cruz de la Sierra'],
    'La Paz':              ['La Paz','El Alto'],
    'Cochabamba':          ['Cochabamba'],
  },
  'Paraguay': {
    'Central':             ['Asunción','Lambaré'],
    'Alto Paraná':         ['Ciudad del Este'],
  },
  'Uruguay': {
    'Montevideo':          ['Montevideo'],
    'Canelones':           ['Las Piedras'],
    'Maldonado':           ['Punta del Este'],
  },
  'Panama': {
    'Panama':              ['Panama City','San Miguelito'],
    'Colón':               ['Colón'],
  },
  'Costa Rica': {
    'San José':            ['San José'],
    'Alajuela':            ['Alajuela'],
    'Cartago':             ['Cartago'],
  },
  'Guatemala': {
    'Guatemala':           ['Guatemala City'],
    'Mixco':               ['Mixco'],
    'Villa Nueva':         ['Villa Nueva'],
  },
  'Cuba': {
    'Havana':              ['Havana'],
    'Santiago de Cuba':    ['Santiago de Cuba'],
    'Camagüey':            ['Camagüey'],
  },
  'Dominican Republic': {
    'National District':   ['Santo Domingo'],
    'Santiago':            ['Santiago de los Caballeros'],
    'La Altagracia':       ['Punta Cana'],
  },
  'Puerto Rico': {
    'San Juan':            ['San Juan','Bayamón','Carolina'],
    'Ponce':               ['Ponce'],
  },
}


export const IP_COUNTRY_MAP: Record<string, string> = {
  UA:'Ukraine', PL:'Poland', DE:'Germany', ES:'Spain', FR:'France',
  IT:'Italy', CZ:'Czech Republic', SK:'Slovakia', HU:'Hungary', RO:'Romania',
  AT:'Austria', GB:'United Kingdom', NL:'Netherlands', BE:'Belgium',
  PT:'Portugal', GR:'Greece', BG:'Bulgaria', HR:'Croatia', RS:'Serbia',
  CH:'Switzerland', KZ:'Kazakhstan', AE:'UAE',
  US:'USA', CA:'Canada', MX:'Mexico', BR:'Brazil', AR:'Argentina',
  CO:'Colombia', CL:'Chile', PE:'Peru', VE:'Venezuela', EC:'Ecuador',
  BO:'Bolivia', PY:'Paraguay', UY:'Uruguay', PA:'Panama', CR:'Costa Rica',
  GT:'Guatemala', CU:'Cuba', DO:'Dominican Republic', PR:'Puerto Rico',
}

export function sortedRegistrationCountries(): string[] {
  return Object.keys(REGISTRATION_GEO_DATA).sort((a, b) => a.localeCompare(b))
}

export function parseRegistrationLocation(location: string): { city: string; region: string; country: string } | null {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return null
  const city = parts[0]
  const country = parts[parts.length - 1]
  const region = parts.length >= 3 ? parts.slice(1, -1).join(', ') : 'Other'
  return { city, region, country }
}
