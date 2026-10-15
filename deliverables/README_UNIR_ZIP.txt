INSTRUCCIONES PARA REUNIR EL ZIP DIVIDIDO
=========================================

Tienes 5 partes:
- casa-abierta-cuba.zip.part_00
- casa-abierta-cuba.zip.part_01
- casa-abierta-cuba.zip.part_02
- casa-abierta-cuba.zip.part_03
- casa-abierta-cuba.zip.part_04

En Linux/Mac/Termux:
  cd carpeta_donde_guardaste_las_partes
  cat casa-abierta-cuba.zip.part_* > casa-abierta-cuba.zip

Verifica integridad:
  unzip -t casa-abierta-cuba.zip

Despues abre el ZIP resultante.
