# **STK Anon - Privacy Engineering Tool**

STK Anon est une application de bureau sécurisée (Windows) conçue pour l'anonymisation, le marquage et la protection de documents sensibles avant leur diffusion.
Contrairement aux outils en ligne, STK Anon fonctionne 100% hors-ligne. Aucun document ne quitte votre machine.

## 🚀 Fonctionnalités Clés

### 🛡️ Confidentialité Totale :
Traitement local (Local-First). Vos fichiers ne sont jamais uploadés sur un cloud.

### 📄 Support Multi-Formats :
Prise en charge native des images (JPG, PNG) et des documents PDF multipages.

### 👁️ Caviardage (Redaction) :
Masquez les zones sensibles (noms, visages, données) avec des rectangles noirs irréversibles.

### ©️ Filigrane (Watermarking) : 
Appliquez des filigranes personnalisés (texte, densité, rotation, opacité) pour prévenir les fuites.

### 🔍 Inspection de Métadonnées : 
Visualisez les données cachées (EXIF, Auteur PDF, Logiciel créateur) avant de partager.

### 💾 Export Haute Qualité : 
Recomposition des PDF et images en haute définition après modification.

### 📸 Aperçu de l'interface

Tableau de bord principal

<img width="1266" height="893" alt="Screenshot 2026-01-31 132554" src="https://github.com/user-attachments/assets/e3cc02d4-eae3-4b97-b44b-07e6328bfb91" />

<img width="1266" height="893" alt="Screenshot 2026-01-31 132812" src="https://github.com/user-attachments/assets/461ecca1-de4e-4146-93af-5facfc09bd6d" />

Édition de PDF et Filigrane

<img width="1313" height="1018" alt="Screenshot 2026-01-31 132909" src="https://github.com/user-attachments/assets/6f169fb9-e9b5-44fd-839a-a801b37d5120" />

<img width="1313" height="787" alt="Screenshot 2026-01-31 133036" src="https://github.com/user-attachments/assets/182198b5-5b55-44ae-9049-6a9937454228" />


## 🛠️ Installation

Pour les utilisateurs (Windows)

Allez dans la section Releases (colonne de droite).

Téléchargez le fichier STK Anon Setup x.x.x.exe de la dernière version.

https://github.com/Arkhamy/stk_anon_tool/releases/download/v1.7.0/STK.Anon.Setup.1.7.0.exe

Lancez l'installation (l'application se lancera automatiquement).


## Pour les développeurs (Build from source)

Pré-requis : Node.js (v18+) et Git.

### 1. Cloner le dépôt
git clone [https://github.com/Arkhamy/stk-anon-tool.git](https://github.com/VOTRE_PSEUDO/stk-anon-tool.git)
cd stk-anon-tool

### 2. Installer les dépendances
npm install

### 3. Lancer en mode développement
npm run electron:dev

### 4. Compiler pour la production
npm run electron:build


## 🔒 Sécurité & Technique

Cette application est construite sur une stack moderne et auditée :

Electron : Pour l'encapsulation système sécurisée.

React + Vite : Pour la performance de l'interface.

PDF.js & jsPDF : Pour le traitement de documents sans dépendances externes.

## ⚠️ Avertissement

Cet outil est fourni pour aider à la protection de la vie privée. L'utilisateur est responsable de vérifier que les documents caviardés ne contiennent plus d'informations sensibles avant diffusion.

Développé par STK - v1.7.0