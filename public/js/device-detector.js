(function() {
  console.log('[Device Detector] Script running.');

  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  const screenWidth = window.innerWidth;
  const existingWidth = getCookie('deviceWidth');

  console.log('[Device Detector] Current screen width:', screenWidth);
  console.log('[Device Detector] Existing cookie value:', existingWidth);

  if (!existingWidth || Math.abs(screenWidth - parseInt(existingWidth, 10)) > 100) {
    console.log('[Device Detector] Condition met. Setting cookie and reloading...');
    document.cookie = `deviceWidth=${screenWidth};path=/`;
    window.location.reload();
  } else {
    console.log('[Device Detector] Condition not met. Doing nothing.');
  }
})();
