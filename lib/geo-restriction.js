export async function isLocationAllowed() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const countryCode = data.country_code;
    console.log('Country detected:', countryCode);
    
    const blockedCountries = [
      'SG', // Singapore
      'CN'  // China
    ];
    
    const isAllowed = !blockedCountries.includes(countryCode);
    console.log('Access allowed:', isAllowed);
    
    return isAllowed;
  } catch (error) {
    console.error('Error checking location:', error);
    return false;
  }
}
