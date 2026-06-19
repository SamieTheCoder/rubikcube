#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const prompts = require('prompts');

async function main() {
  console.log('\n🧊 Rubik\'s Cube 3D Component Installer\n');

  const response = await prompts([
    {
      type: 'select',
      name: 'framework',
      message: 'Which framework are you using?',
      choices: [
        { title: 'React / Next.js (TSX)', value: 'react-tsx' },
        { title: 'React / Next.js (JSX)', value: 'react-jsx' },
        { title: 'Vue', value: 'vue' },
      ],
    },
    {
      type: 'text',
      name: 'directory',
      message: 'Where should the component be installed?',
      initial: (prev) => prev === 'vue' ? 'src/components/ui' : 'components/ui',
    },
  ]);

  if (!response.framework || !response.directory) {
    console.log('❌ Installation cancelled.');
    process.exit(1);
  }

  const templateMap = {
    'react-tsx': { file: 'react/RubiksCube.tsx', name: 'RubiksCube.tsx' },
    'react-jsx': { file: 'react/RubiksCube.jsx', name: 'RubiksCube.jsx' },
    'vue': { file: 'vue/RubiksCube.vue', name: 'RubiksCube.vue' },
  };

  const template = templateMap[response.framework];
  const sourcePath = path.join(__dirname, '..', 'templates', template.file);
  const targetDir = path.join(process.cwd(), response.directory);
  const targetPath = path.join(targetDir, template.name);

  await fs.ensureDir(targetDir);
  await fs.copyFile(sourcePath, targetPath);

  console.log(`\n✅ Installed ${template.name} → ${path.relative(process.cwd(), targetPath)}`);
  console.log('\n📦 Install the required dependency:');
  console.log('   npm install three');

  if (response.framework === 'react-tsx') {
    console.log('   npm install -D @types/three');
  }

  console.log('\n🚀 Usage:');
  if (response.framework === 'vue') {
    console.log(`   <script setup>`);
    console.log(`   import RubiksCube from './${template.name}';`);
    console.log(`   </script>`);
    console.log(`   <template>`);
    console.log(`     <RubiksCube class="w-[500px] h-[500px]" />`);
    console.log(`   </template>`);
  } else {
    console.log(`   import { RubiksCube } from './${template.name.replace(/\.(tsx|jsx)$/, '')}';`);
    console.log(`\n   <RubiksCube className="w-[500px] h-[500px]" />`);
  }

  console.log('');
}

main().catch(console.error);
