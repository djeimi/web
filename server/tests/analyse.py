import json
import language_tool_python
import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Загрузка данных
with open('generation_results_with_adlearning.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Инициализация LanguageTool
tool = language_tool_python.LanguageTool('en-US')

# Инициализация spaCy
nlp = spacy.load('en_core_web_sm')

total_sentences = 0
correct_sentences = 0
similarity_scores = []

print("Начинаем проверку грамматики и схожести...")

# Проверка каждого предложения
for word, sentences in data.items():
    processed_sentences = []
    for sentence in sentences:
        sentence = sentence.replace('___', word)
        matches = tool.check(sentence)
        if len(matches) == 0:
            correct_sentences += 1
        total_sentences += 1
        processed_sentences.append(sentence)

    # Вычисление схожести предложений
    if len(processed_sentences) > 1:
        vectorizer = TfidfVectorizer().fit_transform(processed_sentences)
        vectors = vectorizer.toarray()
        cosine_matrix = cosine_similarity(vectors)

        # Средняя схожесть для каждого слова
        avg_similarity = cosine_matrix.sum() / (cosine_matrix.shape[0] * cosine_matrix.shape[1])
        similarity_scores.append(avg_similarity)

# Расчет процента
accuracy_percent = (correct_sentences / total_sentences) * 100 if total_sentences > 0 else 0
average_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0

print("\nРезультаты generation_results_with_adlearning.json:")
print(f"Всего предложений: {total_sentences}")
print(f"Грамматически верных: {correct_sentences}")
print(f"Процент правильных: {accuracy_percent:.2f}%")
print(f"Средняя схожесть предложений: {average_similarity:.2f}")
