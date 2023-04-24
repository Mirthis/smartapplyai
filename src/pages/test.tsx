import { type NextPage } from "next";
import Title from "~/components/Title";
import { ApplicationDetails } from "~/components/ApplicationDetails";
import { api } from "~/utils/api";
import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "~/store/store";
import { type TestQuestion } from "~/types/types";
import { MAX_TEST_QUESTIONS } from "~/utils/constants";
import { formatApiMessage } from "~/utils/formatter";
import Spinner from "~/components/ui/Spinner";

const InterviewPage: NextPage = () => {
  const {
    job,
    applicant,
    test,
    addTestQuestion,
    addTestAnswer,
    addTestMessage,
    addTestExplanation,
    resetTest,
  } = useAppStore((state) => state);
  console.log({ test });
  const currentQuestion = test?.currentQuestion;
  const messages = test?.messages ?? [];
  const questions = test?.questions ?? [];

  const [displayedQuestion, setDisplayedQuestion] = useState<TestQuestion>();
  const { mutate: newQuestion, isLoading: isLoadingQuestion } =
    api.test.getQuestion.useMutation({
      onSuccess: (data) => {
        addTestQuestion(data.content);
        addTestMessage(data);
      },
    });

  const { mutate: getAnswerExplanation, isLoading: isLoadingAnswer } =
    api.test.getAnswerExplanation.useMutation({
      onSuccess: (data) => {
        const id = test?.lastId;
        if (!id) return;
        addTestExplanation(id, data.content);
        addTestMessage(data);
      },
    });

  const getQuestion = useCallback(() => {
    if (job && applicant) {
      newQuestion({
        job,
        applicant,
      });
    }
  }, [job, applicant, newQuestion]);

  const sendAnswer = (questionId: number, answerId: number) => {
    const question = test?.questions.find((q) => q.id === questionId);
    if (!question) return;
    const answer = question.answers[answerId];
    if (!answer) return;

    if (job && applicant) {
      getAnswerExplanation({
        job,
        applicant,
        answer,
        messages,
      });
    }
    addTestAnswer(questionId, answerId);
  };

  useEffect(() => {
    setDisplayedQuestion(currentQuestion);
  }, [currentQuestion]);

  return (
    <>
      <Title title="Test your knowledge" />
      <ApplicationDetails />
      <div className="mb-4" />
      {questions.length > 1 && (
        <div className="btn-group gap-x-2">
          {questions.map((q, i) => {
            let classes = "";
            if (q.id === displayedQuestion?.id) {
              classes += "btn-primary";
            } else {
              classes +=
                q.providedAnswer === q.correctAnswer
                  ? "btn-success btn-outline"
                  : "btn-error btn-outline";
            }
            return (
              <button
                key={`select-q-${q.id}`}
                className={`${classes} btn rounded-md`}
                onClick={() => setDisplayedQuestion(q)}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      )}
      <div className="mb-4" />
      {isLoadingQuestion && (
        <>
          <h2 className="mb-2 text-2xl font-bold">Loading new question...</h2>
          <div className="flex flex-col space-y-2">
            <div className="btn-outline btn-secondary btn animate-pulse" />
            <div className="btn-outline btn-secondary btn animate-pulse" />
            <div className="btn-outline btn-secondary btn animate-pulse" />
            <div className="btn-outline btn-secondary btn animate-pulse" />
          </div>
        </>
      )}
      {!isLoadingQuestion && displayedQuestion && (
        <>
          <h2 className="mb-2 text-2xl font-bold">
            {displayedQuestion.question}
          </h2>
          <div className="flex flex-col space-y-2">
            {displayedQuestion.answers.map((answer, index) => {
              let classes = "";
              const currentAnswer = displayedQuestion.providedAnswer === index;
              if (currentAnswer) {
                if (
                  displayedQuestion.providedAnswer ===
                  displayedQuestion.correctAnswer
                ) {
                  classes += "btn-success";
                } else {
                  classes += "btn-error";
                }
              }
              return (
                <button
                  key={`q-${displayedQuestion.id}-${index}`}
                  disabled={
                    (displayedQuestion.providedAnswer !== undefined &&
                      !currentAnswer) ||
                    isLoadingAnswer
                  }
                  className={`${classes} btn-outline btn-secondary btn justify-start text-left normal-case`}
                  onClick={() => {
                    sendAnswer(displayedQuestion.id, index);
                  }}
                >
                  {index + 1}. {answer}
                </button>
              );
            })}
          </div>
          {isLoadingAnswer && (
            <div className="mt-4 flex gap-x-2">
              <Spinner /> Verifying you answer...
            </div>
          )}
          {displayedQuestion.explanation && (
            <div className="mt-4">
              <h3 className="mb-2 text-xl font-bold">Explanation</h3>
              {formatApiMessage(displayedQuestion.explanation).map((p, i) => (
                <p key={i} className="mb-2">
                  {p}
                </p>
              ))}
            </div>
          )}
        </>
      )}
      <div className="mb-4" />

      {(!currentQuestion ||
        (currentQuestion.explanation &&
          questions.length < MAX_TEST_QUESTIONS)) && (
        <div className="text-center">
          <button
            disabled={isLoadingQuestion}
            className="btn-primary btn w-full sm:w-96"
            onClick={() => getQuestion()}
          >
            {questions.length == 0 ? "Get First Question" : "Get Next Question"}
          </button>
        </div>
      )}
      {currentQuestion?.explanation &&
        questions.length === MAX_TEST_QUESTIONS && (
          <div>
            <h2 className="mb-2 text-2xl font-bold">
              You have completed the test!
            </h2>
            <button className="btn-primary btn" onClick={resetTest}>
              Start a new test
            </button>
          </div>
        )}
    </>
  );
};

export default InterviewPage;
