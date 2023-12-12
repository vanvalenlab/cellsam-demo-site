import React from 'react';
import axios from 'axios';

interface DeepCellButtonProps {
  myUrl: string;
  uploadedImage: File | null;
  maskFile: string | null;
  axes: string;
}

function DeepCellButton({ myUrl, uploadedImage, maskFile, axes }: DeepCellButtonProps) {
  const handleButtonClick = () => {
    if (!uploadedImage || !maskFile) {
      console.error("Image or mask file is missing");
      return;
    }

    var formData = new FormData();
    formData.append('images', uploadedImage);
    formData.append('labels', maskFile);
    formData.append('axes', axes);

    const newTab = window.open(`${myUrl}/loading`, '_blank');
    axios({
      method: 'post',
      url: `${myUrl}/api/project`,
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((res) => {
      if (newTab) newTab.location.href = `${myUrl}/project?projectId=${res.data}&download=true`;
    })
    .catch((err) => {
      console.log(err);
      if (newTab) newTab.location.href = `${myUrl}/loading?error=${err.message}`;
    });
  };

  return (
    <button onClick={handleButtonClick}>
      Open in DeepCell
    </button>
  );
}

export default DeepCellButton;
