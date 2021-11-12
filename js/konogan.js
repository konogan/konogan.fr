"use strict";

function RandArray(array){
  let rand = Math.random()*array.length | 0;
  let rValue = array[rand];
  return rValue;
}


function RandImgs(array){
  array.map(liEl=>{liEl.style.display="none";});
  let rEl = RandArray(array);
  rEl.style.display="block";
}



(()=>{
  const uls = document.querySelectorAll("ul");
  uls.forEach((ulEl)=>{
    const lisEl = ulEl.querySelectorAll('li');
    const lis =[...lisEl];
    RandImgs(lis)
    lisEl.forEach(liEl=>{
      liEl.addEventListener('click',()=>{
        RandImgs(lis)
      })
    })
  })

})();