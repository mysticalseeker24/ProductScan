import { useState } from "react";
import { API_BASE_URL } from '../config';
import { Navbar } from "../components/Navbar";
import Hero from "../components/Hero";
import MainContent from "../components/MainContent";
import Footer from "../components/Footer";
import WorkflowManager from "../components/WorkflowManager";

const HomePage = () => {
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'workflow'
  const [image, setImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [products, setProducts] = useState([]);

  const handleImageUpload = async (file) => {
    if (activeTab === 'workflow') {
      // Let WorkflowManager handle the upload
      return;
    }

    setImage(URL.createObjectURL(file));
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`${API_BASE_URL}/api/detect`, {
        method: "POST",
        body: formData,
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setProducts(data.detected_products || []);
      setImage(data.processed_image);
    } catch (error) {
      console.error("Error processing image:", error);
      setProducts([]);
      setImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setProducts([]);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'basic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Detection
          </button>
          <button
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'workflow'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            onClick={() => setActiveTab('workflow')}
          >
            Advanced Workflow
          </button>
        </div>

        {activeTab === 'basic' ? (
          <MainContent
            image={image}
            isProcessing={isProcessing}
            products={products}
            onImageUpload={handleImageUpload}
            onRemoveImage={handleRemoveImage}
          />
        ) : (
          <WorkflowManager />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default HomePage;
