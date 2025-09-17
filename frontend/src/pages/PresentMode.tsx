import React from 'react';
import PresentMode from 'components/PresentMode';

const PresentModePage: React.FC = () => {
  return <PresentMode autoAdvance={true} cycleInterval={15} />;
};

export default PresentModePage;
