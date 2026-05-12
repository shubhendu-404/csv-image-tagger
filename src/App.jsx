import { useState } from 'react';
import Upload from './components/Upload';
import TagSetup from './components/TagSetup';
import Tagger from './components/Tagger';
import Export from './components/Export';

export default function App() {
  const [screen, setScreen] = useState('upload');
  const [csvData, setCsvData] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagMap, setTagMap] = useState({});

  return (
    <div className="h-screen bg-gray-950 text-gray-100 overflow-hidden">
      {screen === 'upload' && (
        <Upload
          onUpload={(data) => {
            setCsvData(data);
            setTagMap({});
            setScreen('setup');
          }}
        />
      )}
      {screen === 'setup' && (
        <TagSetup
          tags={tags}
          setTags={setTags}
          productCount={csvData?.products.length ?? 0}
          onStart={() => setScreen('tagger')}
          onBack={() => setScreen('upload')}
        />
      )}
      {screen === 'tagger' && csvData && (
        <Tagger
          products={csvData.products}
          tags={tags}
          tagMap={tagMap}
          setTagMap={setTagMap}
          onExport={() => setScreen('export')}
        />
      )}
      {screen === 'export' && csvData && (
        <Export
          products={csvData.products}
          fields={csvData.fields}
          tags={tags}
          tagMap={tagMap}
          onBack={() => setScreen('tagger')}
        />
      )}
    </div>
  );
}
