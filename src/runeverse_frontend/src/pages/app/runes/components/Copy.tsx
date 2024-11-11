
const Copy = ({ value }: { value: string }) => {
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(value);
      } catch (error) {
        console.error('Error copying to clipboard: ', error);
      }
    };
  
    return (
      <button
        className="px-3 py-1 mt-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
        onClick={copyToClipboard}
      >
        Copy Address
      </button>
    );
  };

export default Copy;