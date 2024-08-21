// src/components/MockInterview.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const MockInterview = () => {
  const [jobRole, setJobRole] = useState('');
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [recording, setRecording] = useState(false);
  const [responses, setResponses] = useState([]);
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [feedback, setFeedback] = useState('');

  const fetchQuestions = async () => {
    if (!jobRole) return;

    try {
      const response = await axios.post('/api/interviews/generate-questions', { jobRole });
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const startRecording = () => {
    const stream = videoRef.current.srcObject;
    const options = { mimeType: 'video/webm' };
    mediaRecorderRef.current = new MediaRecorder(stream, options);

    mediaRecorderRef.current.ondataavailable = handleDataAvailable;
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleDataAvailable = (event) => {
    if (event.data.size > 0) {
      const videoBlob = new Blob([event.data], { type: 'video/webm' });
      uploadVideo(videoBlob);
    }
  };

  const uploadVideo = async (videoBlob) => {
    const formData = new FormData();
    formData.append('video', videoBlob);
    formData.append('responses', JSON.stringify(responses));

    try {
      const response = await axios.post('/api/videos/upload-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Failed to upload video:', error);
    }
  };

  const handleNextQuestion = () => {
    const answer = prompt('Please answer the question: ' + questions[currentQuestion]);
    setResponses([...responses, { question: questions[currentQuestion], answer }]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      stopRecording();
    }
  };

  useEffect(() => {
    const setupMediaStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Error accessing media devices.', error);
      }
    };

    setupMediaStream();
  }, []);

  return (
    <div className="flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Mock Interview</h1>
      <label className="text-lg mb-4">
        Select Job Role:
        <input
          type="text"
          value={jobRole}
          onChange={e => setJobRole(e.target.value)}
          className="ml-2 p-2 border border-gray-300 rounded-md"
        />
      </label>
      <button
        onClick={fetchQuestions}
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mb-6"
      >
        Generate Questions
      </button>
      {questions.length > 0 && (
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-semibold mb-4">Question {currentQuestion + 1}/{questions.length}</h2>
          <p className="mb-4">{questions[currentQuestion]}</p>
          <button
            onClick={handleNextQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Next Question
          </button>
        </div>
      )}
      <div className="flex flex-col items-center mt-6">
        <video ref={videoRef} autoPlay playsInline className="w-96 h-72 border border-gray-300 mb-4"></video>
        <div>
          <button
            onClick={startRecording}
            disabled={recording}
            className={`px-4 py-2 mr-2 ${recording ? 'bg-gray-400' : 'bg-green-600'} text-white rounded-md hover:bg-green-700`}
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={!recording}
            className={`px-4 py-2 ${!recording ? 'bg-gray-400' : 'bg-red-600'} text-white rounded-md hover:bg-red-700`}
          >
            Stop Recording
          </button>
        </div>
      </div>
      {feedback && (
        <div className="mt-6 p-6 bg-gray-100 border border-gray-300 rounded-md w-full text-center">
          <h2 className="text-xl font-semibold mb-2">Feedback</h2>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
