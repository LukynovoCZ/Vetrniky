// Illustrative landscapes only: no geographic coordinates, projects or inventory data.
export const LANDSCAPES={map:'Skutečná lokalita',fields:'Pole a remízky',forest:'Lesní krajina',mixed:'Pole, les a obec'};
export function landscapeHeight(x,z){return 32+15*Math.sin(x/650)*Math.cos(z/730)+5*Math.sin((x+z)/280);}
export function inModelForest(x,z,kind){
  if(Math.hypot(x,z)<150)return false; // clearing for the illustrative turbine
  if(kind==='forest')return Math.hypot(x+40,z-30)<1050 && Math.abs(z-180)>27;
  if(kind==='fields')return (Math.abs(x+300)<55&&z>-850&&z<600)||(Math.hypot(x-480,z+200)<200);
  return (x<-190&&z<400)||(x>380&&z<-150)||(Math.abs(z+700)<70&&x<700);
}
export function treePositions(kind,height=22){
  const trees=[];let seed=2107;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let z=-1050;z<=1050;z+=38)for(let x=-1050;x<=1050;x+=38){const xx=x+(rand()-.5)*26,zz=z+(rand()-.5)*26;if(inModelForest(xx,zz,kind)&&rand()>.13)trees.push({x:xx,z:zz,height,pine:rand()>.55,tone:rand()});}
  return trees;
}
