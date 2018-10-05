;
(function () {
    let navLinks = document.querySelectorAll(".nav-link");
    let statsDiv = document.querySelectorAll('.main-stats')[0];
    let leaguesDiv = document.querySelectorAll(".live-leagues")[0];
    const liveLeaguesTable = document.querySelectorAll(".live-leagues-table")[0];
    
    navLinks.forEach(function (link) {
        link.addEventListener("click", event => {

            navLinks.forEach(function(link){
                link.classList.remove("active");
            });

            event.preventDefault();
            let target = event.target.parentNode;
            target.classList.add("active");

            if(target.classList.contains("stats")) {
                statsDiv.classList.remove("hidden");
                leaguesDiv.classList.add("hidden");
            } else {
                leaguesDiv.classList.remove("hidden");
                liveLeaguesTable.classList.remove("animated");
                liveLeaguesTable.classList.remove("fadeOutDown");
                statsDiv.classList.add("hidden");
            }
        })
    })

})();