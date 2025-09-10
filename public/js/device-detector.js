(function() {
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  const screenWidth = window.innerWidth;
  const existingWidth = getCookie('deviceWidth');

  if (!existingWidth || Math.abs(screenWidth - parseInt(existingWidth)) > 100) {
    document.cookie = `deviceWidth=${screenWidth};path=/`;
    //window.location.reload();
  }
})();
