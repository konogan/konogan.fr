 $(function () {

     $(".rslides").responsiveSlides({
         auto: false,
         pager: true,
         nav: true,
         speed: 400,
         maxwidth: 600,
         namespace: "large-btns"
     });


     $("a[href='#top']").click(function () {
         $("html, body").animate({
             scrollTop: 0
         }, "slow");
         return false;
     });


     $('a[href*=#]:not([href=#])').on('click', function () {
         if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') || location.hostname == this.hostname) {
         var target = $(this.hash);
         target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
         console.log(target);

         if (target.length) {
             $('html,body').animate({
                 scrollTop: target.offset().top
             }, 1200);
             return false;
         }
         }
     });


 });