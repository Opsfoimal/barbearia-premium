import {initialServices} from './services';
export const publicCatalog={
 shop:{name:"DQB STUDIO",address:'Rua Dr. Luiz Losso Filho, 716, Curitiba - PR',hours:'Segunda a sábado, 09h às 19h',whatsapp:'554197717612'},
 services:initialServices.map((service,index)=>({id:index+1,...service})),
 barbers:[{id:1,name:'Rafael Costa',specialty:'Cortes clássicos e acabamento'},{id:2,name:'Lucas Almeida',specialty:'Degradê e barba'}]
};
