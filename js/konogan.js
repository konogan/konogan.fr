"use strict";

function RandArray(array){
  let rand = Math.random()*array.length | 0;
  let rValue = array[rand];
  return rValue;
}

(()=>{

  const uls = document.querySelectorAll("ul");
  console.log(uls);

  uls.forEach((ulEl)=>{
    const lis =[...ulEl.querySelectorAll('li')];
    console.log(lis);
    if (lis.length > 1) {
      setTimeout(function () {
        console.log("ici");
        lis.map(liEl=>{liEl.style.display="none";});
        let rEl = RandArray(lis);
        rEl.style.display="block";
      }, Math.floor(Math.random() * 10));
    }
  })

})();