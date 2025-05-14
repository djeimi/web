import json
from typing import Dict, List
from datasets import Dataset
import pandas as pd
from ragas.metrics import faithfulness, context_precision
from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI
import os
from ragas import evaluate
        
# Set proxy environment variables
os.environ["HTTP_PROXY"] = "http://localhost:2080"
os.environ["HTTPS_PROXY"] = "http://localhost:2080"
os.environ["OPENAI_API_KEY"] = "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"

# Load your dataset
def load_dataset(file_path: str) -> Dict[str, List[str]]:
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: File {file_path} not found.")
        return {}
    except json.JSONDecodeError:
        print(f"Warning: File {file_path} is not valid JSON.")
        return {}

def prepare_for_evaluation(data: Dict[str, List[str]]) -> pd.DataFrame:
    """
    Prepare data for Ragas evaluation
    """
    records = []
    for word, values in data.items():
        for sentence in values['sentences']:
            clean_sentence = sentence.replace("___", word).replace('_', '')
            records.append({
                "question": f"Is this sentence semantically relevant to the word '{word}'?",
                "answer": clean_sentence,
                "context": f"Word: '{word}'. Definition and examples of proper usage for '{word}'.", 
                'retrieved_contexts': [""],
                'reference': values['hint'],
            })
    return pd.DataFrame(records)

def evaluate_sentences(df: pd.DataFrame):
    """
    Evaluate sentences using Ragas metrics
    """
    dataset = Dataset.from_pandas(df)
    
    llm = LangchainLLMWrapper(langchain_llm=ChatOpenAI(temperature=0, model="gpt-4.1-mini"))
    
    result = evaluate(
            dataset=dataset,
            metrics=[context_precision],
            llm=llm,
            raise_exceptions=False
        )
    
    return result

def custom_relevancy_evaluation(df: pd.DataFrame):
    """
    Custom function to directly evaluate relevancy using the LLM
    """
    llm = ChatOpenAI(temperature=0, model="gpt-4.1-mini")
    
    results = []
    for _, row in df.iterrows():
        sentence = row["answer"]
        word = row["context"].split("'")[1]  # Extract word from context
        
        # Craft a prompt for relevancy evaluation
        prompt = f"""
        Please evaluate if this sentence is semantically relevant to the word '{word}':
        
        Sentence: "{sentence}"
        
        Provide a score from 0 to 1 where:
        - 1.0 = Highly relevant to the word
        - 0.0 = Not relevant to the word at all
        
        Response format: Just give the score as a decimal number between 0 and 1.
        """
        
        # Get LLM response
        response = llm.invoke(prompt)
        
        try:
            # Extract the score from the LLM response
            score = float(response.content.strip())
            # Keep within valid range
            score = max(0.0, min(1.0, score))
        except:
            print(f"Warning: Could not parse score from response: {response.content}")
            score = 0.5  # Default score on failure
            
        results.append({
            "sentence": sentence, 
            "word": word,
            "relevancy_score": score
        })
    
    return pd.DataFrame(results)

def custom_grammar_evaluation(df: pd.DataFrame):
    """
    Custom function to directly evaluate grammar using the LLM
    """
    llm = ChatOpenAI(temperature=0, model="gpt-4.1-mini")
    
    results = []
    for _, row in df.iterrows():
        sentence = row["answer"]
        word = row["context"].split("'")[1]  # Extract word from context
        
        # Craft a prompt for grammar and word usage evaluation
        prompt = f"""
        Please evaluate this sentence for grammatical correctness '{word}':
        
        Sentence: "{sentence}"
        
        Provide a score from 0 to 1 where:
        - 1.0 = Perfect grammar 
        - 0.0 = Incorrect grammar
        
        Response format: Just give the score as a decimal number between 0 and 1.
        """
        
        # Get LLM response
        response = llm.invoke(prompt)
        
        try:
            # Try to extract the score from the LLM response
            score = float(response.content.strip())
            # Keep within valid range
            score = max(0.0, min(1.0, score))
        except:
            print(f"Warning: Could not parse score from response: {response.content}")
            score = 0.5  # Default score on failure
            
        results.append({
            "sentence": sentence, 
            "word": word,
            "grammar_score": score
        })
    
    return pd.DataFrame(results)

def main():
    data = load_dataset("data.json")
    
    # Prepare data for evaluation
    evaluation_df = prepare_for_evaluation(data)
    print(f"Prepared {len(evaluation_df)} records for evaluation.")
    print(evaluation_df.head())

    # Approach 1: Use Ragas metrics

    print("Evaluating with Ragas metrics...")
    ragas_results = evaluate_sentences(evaluation_df)   

    print("\nRagas Evaluation Results:")
    df = ragas_results.to_pandas()

    print(f"Average Context Precision: {df['context_precision'].mean()}")
    with open("ragas_results.json", "w") as f:
        json.dump(df.to_dict(), f, indent=4)
    print("\nDetailed Ragas Results saved to ragas_results.json")

    # Approach 2: Use custom direct LLM evaluation for grammar and relevancy
    print("\nEvaluating with custom assessments...")
    
    grammar_results = custom_grammar_evaluation(evaluation_df)
    print("\nGrammar Evaluation Results:")
    print(f"Average Grammar Score: {grammar_results['grammar_score'].mean()}")
    with open("grammar_results.json", "w") as f:
        json.dump(grammar_results.to_dict(orient="records"), f, indent=4)
    print("\nDetailed Grammar Results saved to grammar_results.json")

    df = custom_relevancy_evaluation(evaluation_df)
    print(f"Average Relevancy Score: {df['relevancy_score'].mean()}")
    with open("relevancy_results.json", "w") as f:
        json.dump(df.to_dict(), f, indent=4)
    print("\nDetailed Ragas Results saved to ragas_results.json")

if __name__ == "__main__":
    main()