import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { GoogleGenAI, Type } from "@google/genai";
import { Mic, Volume2, Star, Map, BookOpen, Calculator, Brain, ArrowLeft, Award, Trophy, Sparkles } from "lucide-react";

// --- Types ---
type ViewState = "onboarding" | "map" | "quest" | "profile" | "victory";
type Subject = "Math" | "Reading" | "Logic";

interface UserProfile {
  name: string;
  age: number;
  xp: number;
  level: number;
  badges: string[];
}interface QuestData {
  scenario: string;
  question: string;
…  { xp: 300, title: "Grand Magus" },
];

const SUBJECT_CONFIG = {
  Math: {
    color: "bg-blue-500",
    lightColor: "bg-blue-100",
    icon: <Calculator size={32} />,
    landName: "Math Mountain",
    description: "Solve number puzzles!",
    gradient: "from-blue-400 to-indigo-600"
  },Reading: {
    color: "bg-pink-500",
    lightColor: "bg-pink-100",
    icon: <BookOpen size={32} />,
    landName: "Reading River",
    description: "Discover word magic!",
    gradient: "from-pink-400 to-rose-600"
  },
  Logic: {
    color: "bg-purple-500",
    lightColor: "bg-purple-100",
    icon: <Brain size={32} />,
    landName: "Logic Forest",
    description: "Unlock secret paths!",
    gradient: "from-purple-400 to-violet-600"
  }
};

// --- Gemini Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

const Button = ({ onClick, children, className = "", variant = "primary", disabled = false }: any) => {
  const baseStyle = "transform active:scale-95 transition-all duration-200 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-yellow-400 text-yellow-900 hover:bg-yellow-300 border-b-4 border-yellow-600",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 border-b-4 border-gray-200",
    danger: "bg-red-500 text-white hover:bg-red-400 border-b-4 border-red-700",
    magic: "bg-indigo-600 text-white hover:bg-indigo-500 border-b-4 border-indigo-900"
  };
   return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
    >
      {children}
    </button>
  );
};

// --- Main App Component ---

const App = () => {// State
  const [view, setView] = useState<ViewState>("onboarding");
…  
  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Persist user
  useEffect(() => {
    localStorage.setItem("magicLearnUser", JSON.stringify(user));
  }, [user]);

// Voice Recognition Setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const currentTranscript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(currentTranscript);
      };recognitionRef.current.onend = () => {
        setListening(false);
        // If we have a transcript, submit it automatically after a short pause
        if (transcript.trim().length > 0) {
          handleCheckAnswer(transcript);
        }
      }; recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setListening(false);
      };
    }
  }, [quest, transcript]); // Re-bind if quest changes

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // Stop previous
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9; // Slightly slower for kids
      utterance.pitch = 1.1; // Cheerful pitch
      // Try to find a good voice
      const voices = synthRef.current.getVoices();
      const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
      if (preferredVoice) utterance.voice = preferredVoice;

      synthRef.current.speak(utterance);
    }
  };

const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      setFeedback(null);
      recognitionRef.current?.start();
      setListening(true);
    }
  }; // --- Logic: Generate Quest ---
  const startQuest = async (subject: Subject) => {
    setCurrentSubject(subject);
    setView("quest");
    setLoading(true);
    setQuest(null);
    setFeedback(null);
    setTranscript("");

 try {
      const model = ai.models.generateContent;
      const prompt = `
…        Subject: ${subject} (Math: arithmetic/geometry, Reading: vocab/rhyme, Logic: pattern/riddle).
        
        Return JSON.
      `; const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,properties: {
              scenario: { type: Type.STRING },
              question: { type: Type.STRING },
              correctAnswer: { type: Type.STRING },
              hint: { type: Type.STRING },
            },
            required: ["scenario", "question", "correctAnswer", "hint"]
          }
        }
      }); const data = JSON.parse(response.text);
      setQuest(data);
      setLoading(false);
      speak(`${data.scenario} ${data.question}`);

    } catch (e) {
      console.error(e);
      setLoading(false);
      // Fallback for demo if API fails or offline
      setQuest({
        scenario: "The dragon blocked the path!",
        question: "What is 2 + 2?",
        correctAnswer: "4",
        hint: "Count your fingers!"
      });
 }};
…        Correct Answer: ${quest.correctAnswer}
        User Answer: "${answer}"
        Is the user answer correct? Ignore minor spelling or grammar mistakes.
        If correct, give a short magical praise (max 10 words).
        If incorrect, give a gentle encouragement (max 10 words).
        
        Return JSON: { "isCorrect": boolean, "message": string }
      `;

…            }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              message: { type: Type.STRING }
            }
          }
        }
      });const result = JSON.parse(response.text);
      setFeedback(result.message);
      speak(result.message);

      if (result.isCorrect) {
        // Correct!
        setTimeout(() => {
           const xpGain = 10; const newXp = user.xp + xpGain;
           const newLevel = Math.floor(newXp / 100) + 1;
           const leveledUp = newLevel > user.level;
           
           setUser(u => ({ ...u, xp: newXp, level: newLevel }));
           if (leveledUp) {
             speak("Level Up! You are getting stronger!");}
           setView("victory");
        }, 2000);
      } else {
        setLoading(false);
      }


    } catch (e) {
      // Fallback check
      const isCorrect = answer.toLowerCase().includes(quest.correctAnswer.toLowerCase());
      setFeedback(isCorrect ? "Magical!" : "Try again!");
      setLoading(false);
    }
  };
  // --- Views ---

  if (view === "onboarding") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-500 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md blob-bounce">
          <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-blue-600 mb-2">MagicLearn</h1>
          <p className="text-gray-500 mb-8">Welcome to the fantasy world!</p>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="What is your name?" 
              className="w-full p-4 rounded-xl border-2 border-blue-100 text-lg focus:border-blue-400 outline-none bg-blue-50 text-center"
              value={user.name}
              onChange={(e) => setUser({...user, name: e.target.value})}
            />
            <div className="flex items-center justify-center gap-4">
              <span className="text-gray-600 font-bold">Age: {user.age}</span>
              <input 
                type="range" min="4" max="13" 
                value={user.age} 
                onChange={(e) => setUser({...user, age: parseInt(e.target.value)})}
                className="w-32 accent-blue-500"
              />
            </div> <Button 
              onClick={() => {
                if (user.name) setView("map");
              }}
              className="w-full py-4 text-xl"
            >
              Start Adventure
            </Button>
          </div>
        </div>
      </div> if (view === "map") {
    return (
      <div className="min-h-screen bg-[#f0f9ff] flex flex-col">
        {/* Header */}
        <header className="bg-white p-4 shadow-sm flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-yellow-900 font-bold">
              {user.level}
            </div><div>
              <div className="font-bold text-gray-700">{user.name}</div>
              <div className="text-xs text-gray-400">{user.xp} Magic Dust</div>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setView("profile")} className="py-2 px-4">
            <Trophy size={20} />
          </Button>
        </header>{/* Map Area */}
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto pb-24">
          <h2 className="text-2xl font-bold text-center text-gray-700 mb-2">Choose a Realm</h2>
          
          {(Object.keys(SUBJECT_CONFIG) as Subject[]).map((subj) => (
            <div 
              key={subj}
              onClick={() => startQuest(subj)}
              className={`relative overflow-hidden group cursor-pointer transform transition hover:scale-105 active:scale-95 bg-gradient-to-r ${SUBJECT_CONFIG[subj].gradient} p-6 rounded-3xl shadow-lg shadow-blue-200/50 text-white`}
            ><div className="absolute right-0 bottom-0 opacity-20 transform translate-x-4 translate-y-4">
                {SUBJECT_CONFIG[subj].icon}
              </div>
              <div className="flex items-center gap-4 relative z-10">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  {SUBJECT_CONFIG[subj].icon}
                </div>
                <div> <h3 className="text-2xl font-bold">{SUBJECT_CONFIG[subj].landName}</h3>
                  <p className="opacity-90">{SUBJECT_CONFIG[subj].description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
    }if (view === "quest") {
    const theme = SUBJECT_CONFIG[currentSubject];
    
    return (
      <div className={`min-h-screen bg-gradient-to-b ${theme.gradient} flex flex-col text-white`}>
        <div className="p-4">
          <Button variant="secondary" onClick={() => setView("map")} className="w-10 h-10 !p-0 rounded-full bg-white/20 text-white border-none">
            <ArrowLeft size={24} />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto w-full">
          {loading ? (
             <div className="blob-bounce">
               <Sparkles size={64} className="text-yellow-300 animate-spin" />
               <p className="mt-4 font-bold text-xl">Summoning Quest...</p>
             </div>
          ) : quest ? (  <>
              {/* Mascot / Scenario */}
              <div className="mb-8 relative">
                 <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mx-auto blob-bounce border-4 border-yellow-400">
                    <span className="text-6xl">🧙‍♂️</span>
                 </div>
                 <div className="bg-white text-gray-800 p-4 rounded-2xl mt-6 shadow-xl relative text-lg font-medium">
                    {quest.scenario}
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
                 </div>
              </div>{/* Question */}
              <h2 className="text-3xl font-bold mb-8 glow-text">{quest.question}</h2>

              {/* Interaction Area */}
              <div className="w-full bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20">
                 {/* Feedback Display */}
                 {feedback && (
                   <div className={`mb-4 p-3 rounded-xl font-bold animate-pulse ${feedback.includes("Try") ? "bg-red-500/50" : "bg-green-500/50"}`}>
                     {feedback}
                   </div>
                 )} {/* Transcript */}
                 {listening && (
                   <p className="text-white/80 mb-4 h-6 italic">"{transcript}..."</p>
                 )}

{/* Voice Button */}
                 <div className="flex flex-col items-center gap-4">
                   <button 
                     onClick={toggleListening}
                     className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all ${listening ? 'bg-red-500 pulse-ring' : 'bg-white text-blue-600'}`}
                   > {listening ? <Mic size={40} color="white" /> : <Mic size={40} />}
                   </button>
                   <p className="text-sm opacity-80">{listening ? "Listening..." : "Tap to Speak Answer"}</p>
                 </div>
              </div>

              {/* Text Input Fallback (Accessibility/No Mic) */}
              <div className="mt-8 w-full">
                 <form onSubmit={(e) => {
                     e.preventDefault();
                     const form = e.target as HTMLFormElement;
                     const input = form.elements.namedItem('answer') as HTMLInputElement;
                     handleCheckAnswer(input.value);
                     input.value = "";
                   }}
                   className="flex gap-2" >
                    <input name="answer" type="text" placeholder="Or type here..." className="flex-1 px-4 py-3 rounded-xl text-gray-800" />
                    <Button variant="primary" className="py-3 px-6">Go</Button>
                 </form>
              </div>

              <div className="mt-4">
                <button onClick={() => speak(quest.question)} className="flex items-center gap-2 mx-auto text-sm bg-white/20 px-4 py-2 rounded-full">
                   <Volume2 size={16} /> Replay Audio
                </button>
              </div> >
                    <input name="answer" type="text" placeholder="Or type here..." className="flex-1 px-4 py-3 rounded-xl text-gray-800" />
                    <Button variant="primary" className="py-3 px-6">Go</Button>
                 </form>
              </div>

              <div className="mt-4">
                <button onClick={() => speak(quest.question)} className="flex items-center gap-2 mx-auto text-sm bg-white/20 px-4 py-2 rounded-full">
                   <Volume2 size={16} /> Replay Audio
                </button>
              </div></>
          ) : null}
        </div>
      </div>
    );
  }

  if (view === "victory") {
    return (
      <div className="min-h-screen bg-yellow-400 flex flex-col items-center justify-center p-6 text-center text-yellow-900">
        <Sparkles size={64} className="animate-spin mb-4" />
        <h1 className="text-5xl font-bold mb-4">Quest Complete!</h1>
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm mb-8"><Trophy size={80} className="mx-auto text-yellow-500 mb-4 blob-bounce" />
           <p className="text-2xl font-bold text-gray-700">+10 Magic Dust</p>
           <p className="text-gray-400 mt-2">Current Total: {user.xp}</p>
        </div><div className="flex gap-4 w-full max-w-sm">
           <Button onClick={() => setView("map")} variant="secondary" className="flex-1 py-4">Map</Button>
           <Button onClick={() => startQuest(currentSubject)} variant="primary" className="flex-1 py-4">Next Quest</Button>
        </div>
      </div>
    );
  }

// Profile View
  if (view === "profile") {
    return (
      <div className="min-h-screen bg-indigo-50 flex flex-col">
        <div className="p-4 bg-white shadow-sm flex items-center gap-4">
           <Button variant="secondary" onClick={() => setView("map")} className="w-10 h-10 !p-0 bg-gray-100"><ArrowLeft size={20}/></Button>
           <h1 className="text-xl font-bold">Wizard Profile</h1>
        </div><div className="p-6 flex flex-col items-center">
           <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-white text-4xl mb-4 border-4 border-purple-200">
             🧙
           </div>
           <h2 className="text-2xl font-bold">{user.name}</h2>
           <p className="text-purple-600 font-bold mb-8">{LEVELS.find(l => user.xp >= l.xp)?.title || "Apprentice"} (Lvl {user.level})</p>
           <div className="w-full bg-white rounded-2xl p-6 shadow-sm mb-6">
             <h3 className="font-bold text-gray-500 mb-4 flex items-center gap-2"><Star size={18} /> Stats</h3>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-sm mb-1">
                   <span>Experience</span> <span>{user.xp} / {(user.level * 100)}</span>
                 </div>
                 <div className="w-full bg-gray-100 rounded-full h-3">
                   <div 
                    className="bg-yellow-400 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${(user.xp % 100)}%` }}
                   ></div>
                 </div>
               </div>
             </div>
           </div> <div className="w-full bg-white rounded-2xl p-6 shadow-sm">
             <h3 className="font-bold text-gray-500 mb-4 flex items-center gap-2"><Award size={18} /> Badges</h3>
             <div className="grid grid-cols-4 gap-4">
               {[1, 2, 3, 4].map(i => (
                 <div key={i} className={`aspect-square rounded-full flex items-center justify-center text-2xl ${user.level >= i ? 'bg-blue-100' : 'bg-gray-100 grayscale opacity-50'}`}>
                   {['🌱', '🔥', '💎', '👑'][i-1]}
                 </div>
               ))}</div>
           </div>
        </div>
      </div>
    );
  }

  return <div>Loading Magic...</div>;
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
