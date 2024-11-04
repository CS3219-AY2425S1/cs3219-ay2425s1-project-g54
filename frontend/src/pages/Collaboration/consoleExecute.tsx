import axios from "axios";
import { LANGUAGE_VERSIONS } from "../../components/Collaboration/languageSelector";

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (language:string, sourceCode:string) => {
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  if (response.data.run.output == "") {
    response.data.run.output = "Execution Timed Out";
  }
  return response.data;
};