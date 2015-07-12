import praw

#is this how to do comments
#Strategy:
#	My goal is to build a script that samples reddit (+subreddits) every X hours
# Probably using reddit API, or a webcrawler (builds "pages" faster)
# Stores this data in a file
# Somehow presents this data nicely. Possibly using webcrawled elements, or placing data in a template I make


class Page:
  def __init__(self):
    self.subreddit = "all"
    self.submissions = []

  def addSubmission(self, subm):
    self.submissions.append(subm)

  def getSubmissions(self):
    return self.submissions

class Article:

  def __init__(self):
    self.localvar = "hello"
    self.__private = "hi"

  def __str__(self):
    return "from toString(): " + self.localvar

  def firstMethod(self, var):
    return str(var) + "!!"

x = Article()
print("x = Article()")
print(x.localvar)
print(x)
print(x.firstMethod(5))
print(x._Article__private)

y = Page()
print("\ny = Page()")
y.addSubmission("hihi")
print(y.subreddit)
print(y.submissions)
