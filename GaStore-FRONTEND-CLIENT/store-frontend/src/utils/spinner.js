import { ClipLoader } from 'react-spinners';

const Spinner = ({ loading }) => {
  return (
    loading && (
      <div 
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/70"
        aria-live="assertive"
        aria-busy={loading}
      >
        <ClipLoader 
          color="#4A90E2" 
          loading={loading} 
          size={50}
          speedMultiplier={0.8}
          aria-label="Loading indicator"
        />
        <p className="mt-4 text-white text-lg font-medium">Loading...</p>
      </div>
    )
  );
};

export default Spinner;