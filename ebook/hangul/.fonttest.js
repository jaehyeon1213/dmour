const {Document,Packer,Paragraph,TextRun}=require('docx');
const fs=require('fs');
const d=new Document({sections:[{children:[
  new Paragraph({children:[new TextRun({text:"가나다 abc",font:"맑은 고딕"})]}),
  new Paragraph({children:[new TextRun({text:"가나다 abc",font:{ascii:"Batang",eastAsia:"바탕",hAnsi:"Batang",cs:"Batang"}})]}),
]}]});
Packer.toBuffer(d).then(b=>{fs.writeFileSync('.ft.docx',b);console.log('ok')});
